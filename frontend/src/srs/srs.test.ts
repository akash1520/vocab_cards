import { describe, expect, it } from 'vitest'
import { computeNextReview, isDue, sortByUrgency } from './srs'
import type { Word } from '../api/types'
import { sampleWord } from '../test/fixtures'

const now = new Date('2026-06-16T12:00:00.000Z')

function wordWithSrs(overrides: Partial<Word> = {}): Word {
  return { ...sampleWord, ...overrides }
}

describe('computeNextReview', () => {
  it('resets to learning with a short interval when knew_it is false', () => {
    const result = computeNextReview(
      wordWithSrs({ repetitions: 3, status: 'review', interval_days: 7 }),
      false,
      now,
    )

    expect(result).toEqual({
      status: 'learning',
      interval_days: 0,
      repetitions: 0,
      next_review_at: '2026-06-16T12:10:00.000Z',
      ease_factor: 2.5,
    })
  })

  it('steps through day intervals when knew_it is true on new or learning words', () => {
    const firstPass = computeNextReview(wordWithSrs(), true, now)

    expect(firstPass).toEqual({
      status: 'learning',
      interval_days: 1,
      repetitions: 1,
      next_review_at: '2026-06-17T12:00:00.000Z',
      ease_factor: 2.5,
    })

    const secondPass = computeNextReview(
      wordWithSrs({
        status: 'learning',
        interval_days: 1,
        repetitions: 1,
        next_review_at: '2026-06-17T12:00:00.000Z',
      }),
      true,
      now,
    )

    expect(secondPass).toEqual({
      status: 'learning',
      interval_days: 3,
      repetitions: 2,
      next_review_at: '2026-06-19T12:00:00.000Z',
      ease_factor: 2.5,
    })
  })

  it('multiplies interval by ease_factor when knew_it is true on review words', () => {
    const result = computeNextReview(
      wordWithSrs({
        status: 'review',
        interval_days: 7,
        repetitions: 3,
        ease_factor: 2.5,
        next_review_at: '2026-06-10T12:00:00.000Z',
      }),
      true,
      now,
    )

    expect(result).toEqual({
      status: 'review',
      interval_days: 17,
      repetitions: 4,
      next_review_at: '2026-07-03T12:00:00.000Z',
      ease_factor: 2.5,
    })
  })

  it('marks words as mastered after reaching a 30-day interval with enough repetitions', () => {
    const result = computeNextReview(
      wordWithSrs({
        status: 'review',
        interval_days: 30,
        repetitions: 4,
        ease_factor: 2.5,
        next_review_at: '2026-05-16T12:00:00.000Z',
      }),
      true,
      now,
    )

    expect(result).toEqual({
      status: 'mastered',
      interval_days: 75,
      repetitions: 5,
      next_review_at: '2026-08-30T12:00:00.000Z',
      ease_factor: 2.5,
    })
  })
})

describe('isDue', () => {
  it('treats null next_review_at as due now', () => {
    expect(isDue(wordWithSrs({ next_review_at: null }), now)).toBe(true)
  })

  it('returns true when next_review_at is in the past', () => {
    expect(
      isDue(
        wordWithSrs({ next_review_at: '2026-06-15T12:00:00.000Z' }),
        now,
      ),
    ).toBe(true)
  })

  it('returns false when next_review_at is in the future', () => {
    expect(
      isDue(
        wordWithSrs({ next_review_at: '2026-06-17T12:00:00.000Z' }),
        now,
      ),
    ).toBe(false)
  })
})

describe('sortByUrgency', () => {
  it('puts new and overdue words before scheduled future reviews', () => {
    const words = [
      wordWithSrs({
        id: 'future',
        next_review_at: '2026-06-20T12:00:00.000Z',
      }),
      wordWithSrs({
        id: 'new',
        next_review_at: null,
      }),
      wordWithSrs({
        id: 'overdue',
        next_review_at: '2026-06-10T12:00:00.000Z',
      }),
    ]

    const sorted = sortByUrgency(words, now)

    expect(sorted.map((word) => word.id)).toEqual(['new', 'overdue', 'future'])
  })
})
