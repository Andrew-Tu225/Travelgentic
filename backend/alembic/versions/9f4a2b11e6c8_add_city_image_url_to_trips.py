"""add_city_image_url_to_trips

Revision ID: 9f4a2b11e6c8
Revises: 6155ad463cc2
Create Date: 2026-03-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f4a2b11e6c8"
down_revision: Union[str, Sequence[str], None] = "6155ad463cc2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("trips", sa.Column("city_image_url", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("trips", "city_image_url")
