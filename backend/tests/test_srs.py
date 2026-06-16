from datetime import UTC, datetime

import pytest

from app.schemas.word import Word
from app.services.srs import compute_next_review, is_due, sort_by_urgency

NOW = datetime(2026, 6, 16, 12, 0, 0, tzinfo=UTC)

SAMPLE_WORD = Word(
    id="word-1",
    term="unnerve",
    part_of_speech="verb",
    definition="to make nervous or upset",
    synonyms=["enervate", "faze", "unsettle"],
    example_sentence="At one time unnerved by math problems, she began avidly studying.",
    ease_factor=2.5,
    interval_days=0,
    repetitions=0,
    next_review_at=None,
    status="new",
)


def word_with_srs(**overrides) -> Word:
    return SAMPLE_WORD.model_copy(update=overrides)


class TestComputeNextReview:
    def test_resets_to_learning_with_short_interval_when_knew_it_is_false(self):
        result = compute_next_review(
            word_with_srs(repetitions=3, status="review", interval_days=7),
            False,
            NOW,
        )

        assert result.status == "learning"
        assert result.interval_days == 0
        assert result.repetitions == 0
        assert result.next_review_at == datetime(2026, 6, 16, 12, 10, 0, tzinfo=UTC)
        assert result.ease_factor == 2.5

    def test_steps_through_day_intervals_when_knew_it_is_true_on_new_or_learning_words(self):
        first_pass = compute_next_review(word_with_srs(), True, NOW)

        assert first_pass.status == "learning"
        assert first_pass.interval_days == 1
        assert first_pass.repetitions == 1
        assert first_pass.next_review_at == datetime(2026, 6, 17, 12, 0, 0, tzinfo=UTC)
        assert first_pass.ease_factor == 2.5

        second_pass = compute_next_review(
            word_with_srs(
                status="learning",
                interval_days=1,
                repetitions=1,
                next_review_at=datetime(2026, 6, 17, 12, 0, 0, tzinfo=UTC),
            ),
            True,
            NOW,
        )

        assert second_pass.status == "learning"
        assert second_pass.interval_days == 3
        assert second_pass.repetitions == 2
        assert second_pass.next_review_at == datetime(2026, 6, 19, 12, 0, 0, tzinfo=UTC)
        assert second_pass.ease_factor == 2.5

    def test_multiplies_interval_by_ease_factor_when_knew_it_is_true_on_review_words(self):
        result = compute_next_review(
            word_with_srs(
                status="review",
                interval_days=7,
                repetitions=3,
                ease_factor=2.5,
                next_review_at=datetime(2026, 6, 10, 12, 0, 0, tzinfo=UTC),
            ),
            True,
            NOW,
        )

        assert result.status == "review"
        assert result.interval_days == 17
        assert result.repetitions == 4
        assert result.next_review_at == datetime(2026, 7, 3, 12, 0, 0, tzinfo=UTC)
        assert result.ease_factor == 2.5

    def test_marks_words_as_mastered_after_reaching_30_day_interval_with_enough_repetitions(self):
        result = compute_next_review(
            word_with_srs(
                status="review",
                interval_days=30,
                repetitions=4,
                ease_factor=2.5,
                next_review_at=datetime(2026, 5, 16, 12, 0, 0, tzinfo=UTC),
            ),
            True,
            NOW,
        )

        assert result.status == "mastered"
        assert result.interval_days == 75
        assert result.repetitions == 5
        assert result.next_review_at == datetime(2026, 8, 30, 12, 0, 0, tzinfo=UTC)
        assert result.ease_factor == 2.5


class TestIsDue:
    def test_treats_null_next_review_at_as_due_now(self):
        assert is_due(word_with_srs(next_review_at=None), NOW) is True

    def test_returns_true_when_next_review_at_is_in_the_past(self):
        assert (
            is_due(
                word_with_srs(next_review_at=datetime(2026, 6, 15, 12, 0, 0, tzinfo=UTC)),
                NOW,
            )
            is True
        )

    def test_returns_false_when_next_review_at_is_in_the_future(self):
        assert (
            is_due(
                word_with_srs(next_review_at=datetime(2026, 6, 17, 12, 0, 0, tzinfo=UTC)),
                NOW,
            )
            is False
        )


class TestSortByUrgency:
    def test_puts_new_and_overdue_words_before_scheduled_future_reviews(self):
        words = [
            word_with_srs(
                id="future",
                next_review_at=datetime(2026, 6, 20, 12, 0, 0, tzinfo=UTC),
            ),
            word_with_srs(id="new", next_review_at=None),
            word_with_srs(
                id="overdue",
                next_review_at=datetime(2026, 6, 10, 12, 0, 0, tzinfo=UTC),
            ),
        ]

        sorted_words = sort_by_urgency(words, NOW)

        assert [word.id for word in sorted_words] == ["new", "overdue", "future"]
