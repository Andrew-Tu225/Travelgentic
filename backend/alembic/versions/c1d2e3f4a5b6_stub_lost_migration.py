"""stub_lost_migration

Revision ID: c1d2e3f4a5b6
Revises: 9f4a2b11e6c8
Create Date: 2026-04-03 00:00:00.000000

Stub for a migration that was applied to the DB but whose file was lost via git reset.
The schema changes from that migration are already present in the database.
"""
from typing import Sequence, Union

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "9f4a2b11e6c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
