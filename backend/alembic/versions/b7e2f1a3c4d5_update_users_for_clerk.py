"""update_users_for_clerk

Revision ID: b7e2f1a3c4d5
Revises: ca014a679ecd
Create Date: 2026-03-09 00:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e2f1a3c4d5'
down_revision: Union[str, Sequence[str]] = 'ca014a679ecd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Clerk fields, drop username and email."""
    # Add new columns
    op.add_column('users', sa.Column('clerk_id', sa.String(length=255), nullable=False))
    op.add_column('users', sa.Column('trips_generated', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('is_subscribed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))

    # Add unique constraint for clerk_id
    op.create_unique_constraint('uq_users_clerk_id', 'users', ['clerk_id'])

    # Drop old columns
    op.drop_constraint('users_username_key', 'users', type_='unique')
    op.drop_column('users', 'username')
    op.drop_constraint('users_email_key', 'users', type_='unique')
    op.drop_column('users', 'email')


def downgrade() -> None:
    """Reverse: restore username and email, drop Clerk fields."""
    # Re-add old columns
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=False))
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    op.add_column('users', sa.Column('username', sa.String(length=50), nullable=False))
    op.create_unique_constraint('users_username_key', 'users', ['username'])

    # Drop new columns
    op.drop_constraint('uq_users_clerk_id', 'users', type_='unique')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'is_subscribed')
    op.drop_column('users', 'trips_generated')
    op.drop_column('users', 'clerk_id')
