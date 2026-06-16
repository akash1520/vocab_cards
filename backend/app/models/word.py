import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import UserRow


class WordRow(Base):
    __tablename__ = "words"
    __table_args__ = (UniqueConstraint("user_id", "term", name="uq_words_user_id_term"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    term: Mapped[str] = mapped_column(String(255), nullable=False)
    part_of_speech: Mapped[str] = mapped_column(String(64), nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    synonyms: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    example_sentence: Mapped[str] = mapped_column(Text, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, nullable=False, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["UserRow"] = relationship(back_populates="words")
