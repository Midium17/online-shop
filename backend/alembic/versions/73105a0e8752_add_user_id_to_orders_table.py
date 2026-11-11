"""Add user_id to orders table

Revision ID: 73105a0e8752
Revises: bec6bfbec40b
Create Date: 2026-11-11 03:00:59.060001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73105a0e8752'
down_revision: Union[str, Sequence[str], None] = 'bec6bfbec40b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if user_id column already exists before adding it (safe for SQLite)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('orders')]

    if 'user_id' not in existing_columns:
        op.add_column('orders', sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))

def downgrade() -> None:
    pass