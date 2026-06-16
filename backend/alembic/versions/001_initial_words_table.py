"""initial words table

Revision ID: 001
Revises:
Create Date: 2026-06-16

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "words",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("term", sa.String(length=255), nullable=False),
        sa.Column("part_of_speech", sa.String(length=64), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column("synonyms", sa.JSON(), nullable=False),
        sa.Column("example_sentence", sa.Text(), nullable=False),
        sa.Column("ease_factor", sa.Float(), nullable=False),
        sa.Column("interval_days", sa.Integer(), nullable=False),
        sa.Column("repetitions", sa.Integer(), nullable=False),
        sa.Column("next_review_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("term"),
    )


def downgrade() -> None:
    op.drop_table("words")
