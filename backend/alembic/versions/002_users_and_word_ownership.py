"""users and word ownership

Revision ID: 002
Revises: 001
Create Date: 2026-06-16

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.execute(sa.text("DELETE FROM words"))

    op.drop_constraint("words_term_key", "words", type_="unique")
    op.add_column("words", sa.Column("user_id", sa.String(length=36), nullable=False))
    op.create_foreign_key(
        "fk_words_user_id_users",
        "words",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_words_user_id", "words", ["user_id"], unique=False)
    op.create_unique_constraint("uq_words_user_id_term", "words", ["user_id", "term"])


def downgrade() -> None:
    op.drop_constraint("uq_words_user_id_term", "words", type_="unique")
    op.drop_index("ix_words_user_id", table_name="words")
    op.drop_constraint("fk_words_user_id_users", "words", type_="foreignkey")
    op.drop_column("words", "user_id")
    op.create_unique_constraint("words_term_key", "words", ["term"])

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
