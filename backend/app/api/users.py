"""
User sync endpoint.

Called by the frontend after every Clerk auth event (signup or login).
Upserts the user row so we always have a local record.
"""

import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.database import get_db
from app.models.models import User
from app.core.clerk_auth import require_clerk_user

logger = logging.getLogger(__name__)

router = APIRouter()


class UserSyncResponse(BaseModel):
    clerk_id: str
    trips_generated: int
    is_subscribed: bool


@router.post("/users/sync", response_model=UserSyncResponse)
async def sync_user(
    clerk_id: str = Depends(require_clerk_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync a Clerk user to the local database.

    - If the user doesn't exist, create a new row.
    - If the user already exists, return the existing record.
    """
    # Check if user exists
    result = await db.execute(
        select(User).where(User.clerk_id == clerk_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # New user — create row
        user = User(clerk_id=clerk_id)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Created new user for clerk_id={clerk_id}")
    else:
        # Update timestamp to track last active
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        logger.info(f"Existing user found for clerk_id={clerk_id}, updated_at refreshed")

    return UserSyncResponse(
        clerk_id=user.clerk_id,
        trips_generated=user.trips_generated,
        is_subscribed=user.is_subscribed,
    )
