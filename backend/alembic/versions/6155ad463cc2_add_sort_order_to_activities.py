"""add_sort_order_to_activities

Revision ID: 6155ad463cc2
Revises: 6337929afd58
Create Date: 2026-03-20 00:15:38.713895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6155ad463cc2'
down_revision: Union[str, Sequence[str], None] = '6337929afd58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "activities",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("activities", "sort_order")
