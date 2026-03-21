"""
Chatbot agent runner.

Responsible for:
- Building the system prompt with trip header and compressed itinerary
- Running a Gemini tool-calling loop (max 5 iterations)
- Executing tools via app.services.chatbot.tools.execute_tool
- Returning a short chatbot message plus the updated itinerary
"""

import json
import logging
import os
from typing import Any

from google import genai
from google.genai import types

from app.services.chatbot.context import build_trip_header, compress_itinerary
from app.services.chatbot.tools import TOOL_DECLARATIONS, execute_tool


logger = logging.getLogger(__name__)

MAX_ITERATIONS = 5

SYSTEM_PROMPT = """You are a travel planning assistant helping a user refine their itinerary.

Trip context:
{trip_header}

Current itinerary:
{compressed_itinerary}

You have access to tools to search for places and modify the itinerary.

CRITICAL RULES:
- Itinerary CHANGE requested (add/remove/move/swap/replace/modify): You MUST call the appropriate tools (`search_places`, then `update_itinerary`) before sending your final reply. Do not just describe what you would do — execute the change.
- Question only (no itinerary change): Respond with text only. Do NOT call any tools.

When the user asks to ADD an activity:
- If search_places returns 0 results or results irrelevant to outdoor activities, retry with a different query (e.g., broader or more specific).
- Run 2–3 `search_places` attempts with different queries before giving up.
- Use specific outdoor queries like: "park near <neighborhood/canal> <city>", "scenic walk <city>", "bike rental <city>", "botanical garden <city>", "viewpoint <city>", "outdoor market <city>", "river walk <city>".
- To minimize steps, when searching for an outdoor activity you MAY call search_places multiple times in a single response with different queries (e.g. "park near Navigli Milan", "botanical garden Milan", "scenic walk Milan"). Evaluate all results together and pick the best one before calling update_itinerary. Do not call update_itinerary until you have searched at least once.
- Prefer adding a real place (with `place_id`) to the itinerary via `update_itinerary`.
- For `update_itinerary` operation "add", fields MUST include: place_name, time_window, description, estimated_cost_usd (cost band), category_tag.
- After adding, the activity must fit the day’s schedule (pick a non-overlapping time_window) and match the trip budget tier.

ALLOWED VALUES (use exactly these when adding or modifying activities):
- category_tag: MUST be one of food, nature, culture, nightlife, adventure, wellness (no other values).
- estimated_cost_usd: Use a cost band matching the trip budget — "free", "$1-20", "$20-60", or "$60+".

When the user asks to REMOVE or MODIFY:
- Use the existing itinerary `place_id` for the target activity.
- For modify, only change the fields the user requested.

When making changes, always explain what you did and why it fits the trip.
Never modify days the user didn't ask about.
Only after 2–3 distinct searches fail (0 results or irrelevant) should you respond that you couldn’t find a suitable place.
When changing multiple activities on the same day, prefer batching them into as few update_itinerary calls as possible.
Keep your final reply brief (1–3 short sentences). Your final reply must explicitly confirm what changed (or explicitly say no changes were made). Avoid bullet lists unless asked.

When the user asks to INTRODUCE, DESCRIBE, or TELL ME ABOUT places on a day: Call get_place_details for each place on that day to fetch editorial_summary and other details — the itinerary only has names, times, and place_ids. Then give an engaging, narrative introduction. Use flowing prose, not dry lists. Never show place_id to the user (it's internal)."""


async def run_chatbot_agent(
    trip: dict[str, Any],
    itinerary: list[dict[str, Any]],
    user_message: str) -> dict[str, Any]:
    """
    Run the chatbot agent loop with a hard cap of MAX_ITERATIONS.

    Args:
        trip: Trip-level context (as shaped by /api/generation.get_trip_details, minus itinerary).
        itinerary: List of days (day_number, theme, activities).
        user_message: The latest user input for the chatbot.

    Returns:
        {
            "message": "<short chatbot message>",
            "itinerary": <full updated itinerary list>
        }
    """
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    logger.info("[chatbot] Starting agent | user_message=%s", user_message[:200] + "..." if len(user_message) > 200 else user_message)

    # Initial context
    trip_header = build_trip_header(trip)
    compressed = compress_itinerary(itinerary)
    system_text = SYSTEM_PROMPT.format(
        trip_header=trip_header,
        compressed_itinerary=compressed,
    )

    # keep the conversation as a list of Content objects.
    # System instruction is passed separately — keeps history clean and avoids the model "replying to" instructions.
    conversation: list[types.Content] = [
        types.Content(role="user", parts=[types.Part.from_text(text=user_message)]),
    ]

    tools = [types.Tool(function_declarations=TOOL_DECLARATIONS)]
    logger.info("[chatbot] Conversation started with 1 user turn (system_instruction separate)")

    for iteration in range(MAX_ITERATIONS):
        logger.info("[chatbot] ---- Iteration %s/%s ---- sending %s turns to Gemini", iteration + 1, MAX_ITERATIONS, len(conversation))

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=conversation,
            config=types.GenerateContentConfig(
                system_instruction=system_text,
                tools=tools,
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode="AUTO")
                ),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                temperature=0.4,
                max_output_tokens=512,
            ),
        )

        # If the model produced function calls, execute them.
        function_calls = response.function_calls or []
        logger.info("[chatbot] Response: function_calls=%s", len(function_calls))

        if function_calls:
            # Process all function calls in this response (batched). Execute each, collect results
            # into a single user turn with multiple Part.from_function_response parts.
            logger.info("[chatbot] Branch: executing %s batched tool(s), will continue loop", len(function_calls))
            tool_response_parts: list[types.Part] = []
            for fc in function_calls:
                name = fc.name
                args: dict[str, Any]
                try:
                    # google.genai response.function_calls returns FunctionCall objects
                    # with args directly on the object (keyword args dict-like).
                    raw_args = getattr(fc, "args", None)
                    if isinstance(raw_args, dict):
                        args = dict(raw_args)
                    elif raw_args is None:
                        args = {}
                    else:
                        # Fallback if args are serialized as JSON string
                        args = json.loads(raw_args or "{}")
                except Exception as e:  # pragma: no cover - defensive
                    logger.warning("[chatbot] Failed to parse args for tool %s: %s", name, e)
                    args = {}

                # Avoid spamming downstream APIs with empty/invalid args.
                if not args:
                    logger.info("[chatbot] Tool %s: skipped (missing args)", name)
                    result = {"result": f"{name}() -> skipped (missing args)"}
                else:
                    logger.info("[chatbot] Tool %s: executing | args=%s", name, json.dumps(args))
                    result = await execute_tool(
                        name,
                        args,
                        current_itinerary=itinerary,
                    )
                    r = str(result.get("result", result))
                    logger.info("[chatbot] Tool %s: result=%s", name, r[:200] + ("..." if len(r) > 200 else ""))
                    # If itinerary was updated, keep new state
                    if name == "update_itinerary" and "updated_itinerary" in result:
                        itinerary = result["updated_itinerary"]  # type: ignore[assignment]
                        logger.info("[chatbot] Tool %s: itinerary updated (%s days)", name, len(itinerary))

                tool_response_parts.append(
                    types.Part.from_function_response(name=name, response=result)
                )

            # Record the model's turn first (alternating user/model structure).
            candidate = response.candidates[0]
            model_content = getattr(candidate, "content", None)
            model_parts = getattr(model_content, "parts", []) if model_content else []
            conversation.append(
                types.Content(role="model", parts=model_parts)
            )
            conversation.append(
                types.Content(role="user", parts=tool_response_parts)
            )
            logger.info("[chatbot] Appended model turn + user (tool results), conversation now %s turns | continuing loop", len(conversation))

            # Continue loop to let the model incorporate these results.
            continue

        # No function calls: treat this as the final assistant message.
        logger.info("[chatbot] Branch: no function calls -> model produced final text reply")
        candidate = response.candidates[0] if response.candidates else None
        if not candidate:
            logger.warning("[chatbot] No candidates in response; returning fallback (itinerary unchanged)")
            return {
                "message": "Something went wrong, but I kept your itinerary unchanged.",
                "itinerary": itinerary,
            }

        # Some responses may populate response.text while candidate.content can be None.
        # Be defensive and extract text safely.
        final_message = ""
        if getattr(response, "text", None):
            final_message = (response.text or "").strip()
        else:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) if content is not None else None
            if parts:
                text_parts: list[str] = []
                for part in parts:
                    if hasattr(part, "text") and part.text:
                        text_parts.append(part.text)
                final_message = " ".join(text_parts).strip()

        final_message = final_message or "Done."
        logger.info("[chatbot] Final message: %s", final_message[:300] + ("..." if len(final_message) > 300 else ""))
        logger.info("[chatbot] Returning success | itinerary has %s days", len(itinerary))

        return {
            "message": final_message,
            "itinerary": itinerary,
        }

    # If we reach here, we hit the iteration cap without a non-tool-only turn.
    logger.warning("[chatbot] Hit MAX_ITERATIONS=%s without final text-only turn | returning step limit message", MAX_ITERATIONS)
    return {
        "message": "I hit my step limit. Please try again with a shorter request.",
        "itinerary": itinerary,
    }

