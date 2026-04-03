"""remove_users_table

Revision ID: a1b2c3d4e5f6
Revises: 9f4a2b11e6c8
Create Date: 2026-04-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop user_id FK from trips and drop the users table."""
    # Drop the FK constraint and user_id column from trips
    op.drop_constraint("trips_user_id_fkey", "trips", type_="foreignkey")
    op.drop_column("trips", "user_id")

    # Drop the users table
    op.drop_table("users")


def downgrade() -> None:
    """Recreate users table and user_id column on trips."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("clerk_id", sa.String(255), unique=True, nullable=False),
        sa.Column("trips_generated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_subscribed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "trips",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "trips_user_id_fkey", "trips", "users", ["user_id"], ["id"]
    )
