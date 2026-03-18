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
When making changes, always explain what you did and why it fits the trip.
Never modify days the user didn't ask about.
If a search returns no good results, say so rather than adding a poor fit.
When changing multiple activities on the same day, prefer batching them into as few update_itinerary calls as possible.
Keep your final reply brief (1–3 sentences)."""


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

    # Initial context
    trip_header = build_trip_header(trip)
    compressed = compress_itinerary(itinerary)
    system_text = SYSTEM_PROMPT.format(
        trip_header=trip_header,
        compressed_itinerary=compressed,
    )

    # We keep the conversation as a list of Content objects.
    conversation: list[types.Content] = [
        types.Content(role="user", parts=[types.Part.from_text(system_text + "\n\nUser: " + user_message)])
    ]

    tools = [types.Tool(function_declarations=TOOL_DECLARATIONS)]

    for iteration in range(MAX_ITERATIONS):
        logger.info("Chatbot agent iteration %s/%s", iteration + 1, MAX_ITERATIONS)

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=conversation,
            config=types.GenerateContentConfig(
                tools=tools,
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode="ANY")
                ),
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    maximum_remote_calls=1
                ),
                temperature=0.4,
                max_output_tokens=512,
            ),
        )

        # If the model produced function calls, execute them.
        function_calls = response.function_calls or []
        if function_calls:
            tool_results_texts: list[str] = []
            for fc in function_calls:
                name = fc.name
                args: dict[str, Any]
                try:
                    if isinstance(fc.function_call.args, dict):
                        args = dict(fc.function_call.args)
                    else:
                        # Fallback if args are serialized
                        args = json.loads(fc.function_call.args or "{}")
                except Exception as e:  # pragma: no cover - defensive
                    logger.warning("Failed to parse args for tool %s: %s", name, e)
                    args = {}

                logger.info("Executing tool %s with args=%s", name, args)
                result = await execute_tool(
                    name,
                    args,
                    current_itinerary=itinerary,
                )

                # If itinerary was updated, keep new state
                if name == "update_itinerary" and "updated_itinerary" in result:
                    itinerary = result["updated_itinerary"]  # type: ignore[assignment]

                summary = f"{name}({json.dumps(args, indent=None)}) -> {result.get('result')}"
                tool_results_texts.append(summary)

            # Feed tool results back as a new user-style message so the model can respond.
            tool_results_block = "Tool results:\n" + "\n".join(tool_results_texts) + "\n\nNow respond to the user."
            conversation.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(tool_results_block)],
                )
            )

            # Continue loop to let the model incorporate these results.
            continue

        # No function calls: treat this as the final assistant message.
        candidate = response.candidates[0] if response.candidates else None
        if not candidate:
            logger.warning("No candidates in Gemini response; returning fallback message.")
            return {
                "message": "Something went wrong, but I kept your itinerary unchanged.",
                "itinerary": itinerary,
            }

        text_parts: list[str] = []
        for part in candidate.content.parts:
            if hasattr(part, "text") and part.text:
                text_parts.append(part.text)
        final_message = " ".join(text_parts).strip() or "I've updated your itinerary as requested."

        return {
            "message": final_message,
            "itinerary": itinerary,
        }

    # If we reach here, we hit the iteration cap without a non-tool-only turn.
    logger.info("Chatbot agent reached MAX_ITERATIONS=%s without final text-only turn.", MAX_ITERATIONS)
    return {
        "message": "I've applied the main changes within my step limit. Here's your latest itinerary.",
        "itinerary": itinerary,
    }

