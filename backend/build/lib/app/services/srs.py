from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

from app.schemas.word import Word, WordStatus
from app.services.srs_constants import (
    LEARNING_INTERVALS_DAYS,
    LEARNING_RETRY_MINUTES,
    MASTERED_INTERVAL_DAYS,
    MASTERED_REPETITIONS,
    MAX_INTERVAL_DAYS,
    MIN_EASE_FACTOR,
    REVIEW_REPETITIONS,
)


@dataclass
class SrsUpdate:
    status: WordStatus
    interval_days: int
    repetitions: int
    next_review_at: datetime | None
    ease_factor: float


def _resolve_status(interval_days: int, repetitions: int) -> WordStatus:
    if interval_days >= MASTERED_INTERVAL_DAYS and repetitions >= MASTERED_REPETITIONS:
        return "mastered"
    if repetitions >= REVIEW_REPETITIONS:
        return "review"
    return "learning"


def _add_minutes(now: datetime, minutes: int) -> datetime:
    return now + timedelta(minutes=minutes)


def _add_days(now: datetime, days: int) -> datetime:
    return now + timedelta(days=days)


def compute_next_review(word: Word, knew_it: bool, now: datetime) -> SrsUpdate:
    if not knew_it:
        return SrsUpdate(
            status="learning",
            interval_days=0,
            repetitions=0,
            next_review_at=_add_minutes(now, LEARNING_RETRY_MINUTES),
            ease_factor=word.ease_factor,
        )

    if word.status in ("review", "mastered"):
        repetitions = word.repetitions + 1
        ease_factor = max(word.ease_factor, MIN_EASE_FACTOR)
        interval_days = min(int(word.interval_days * ease_factor), MAX_INTERVAL_DAYS)
        return SrsUpdate(
            status=_resolve_status(interval_days, repetitions),
            interval_days=interval_days,
            repetitions=repetitions,
            next_review_at=_add_days(now, interval_days),
            ease_factor=ease_factor,
        )

    repetitions = word.repetitions + 1
    index = min(repetitions - 1, len(LEARNING_INTERVALS_DAYS) - 1)
    interval_days = LEARNING_INTERVALS_DAYS[index]
    return SrsUpdate(
        status=_resolve_status(interval_days, repetitions),
        interval_days=interval_days,
        repetitions=repetitions,
        next_review_at=_add_days(now, interval_days),
        ease_factor=word.ease_factor,
    )


def is_due(word: Word, now: datetime) -> bool:
    if word.next_review_at is None:
        return True
    review_at = word.next_review_at
    if review_at.tzinfo is None:
        review_at = review_at.replace(tzinfo=UTC)
    now_aware = now if now.tzinfo else now.replace(tzinfo=UTC)
    return review_at <= now_aware


def _urgency_rank(word: Word, now: datetime) -> tuple[int, float]:
    if word.next_review_at is None:
        return (0, 0.0)

    review_at = word.next_review_at
    if review_at.tzinfo is None:
        review_at = review_at.replace(tzinfo=UTC)
    now_aware = now if now.tzinfo else now.replace(tzinfo=UTC)
    review_ms = review_at.timestamp()
    now_ms = now_aware.timestamp()

    if review_ms <= now_ms:
        return (1, review_ms)
    return (2, review_ms)


def sort_by_urgency(words: list[Word], now: datetime) -> list[Word]:
    return sorted(
        words,
        key=lambda word: _urgency_rank(word, now),
    )
