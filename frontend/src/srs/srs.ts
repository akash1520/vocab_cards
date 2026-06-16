import type { Word, WordStatus } from '../api/types'

const LEARNING_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const
const LEARNING_RETRY_MINUTES = 10
const MAX_INTERVAL_DAYS = 90
const MIN_EASE_FACTOR = 1.3

export type SrsUpdate = Pick<
  Word,
  'status' | 'interval_days' | 'repetitions' | 'next_review_at' | 'ease_factor'
>

function addMinutes(from: Date, minutes: number): string {
  return new Date(from.getTime() + minutes * 60_000).toISOString()
}

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString()
}

function resolveStatus(
  intervalDays: number,
  repetitions: number,
): WordStatus {
  if (intervalDays >= 30 && repetitions >= 4) {
    return 'mastered'
  }

  if (repetitions >= 3) {
    return 'review'
  }

  return 'learning'
}

export function computeNextReview(
  word: Word,
  knewIt: boolean,
  now: Date,
): SrsUpdate {
  if (!knewIt) {
    return {
      status: 'learning',
      interval_days: 0,
      repetitions: 0,
      next_review_at: addMinutes(now, LEARNING_RETRY_MINUTES),
      ease_factor: word.ease_factor,
    }
  }

  if (word.status === 'review' || word.status === 'mastered') {
    const repetitions = word.repetitions + 1
    const easeFactor = Math.max(word.ease_factor, MIN_EASE_FACTOR)
    const intervalDays = Math.min(
      Math.floor(word.interval_days * easeFactor),
      MAX_INTERVAL_DAYS,
    )

    return {
      status: resolveStatus(intervalDays, repetitions),
      interval_days: intervalDays,
      repetitions,
      next_review_at: addDays(now, intervalDays),
      ease_factor: word.ease_factor,
    }
  }

  const repetitions = word.repetitions + 1
  const intervalDays =
    LEARNING_INTERVALS_DAYS[
      Math.min(repetitions - 1, LEARNING_INTERVALS_DAYS.length - 1)
    ]

  return {
    status: resolveStatus(intervalDays, repetitions),
    interval_days: intervalDays,
    repetitions,
    next_review_at: addDays(now, intervalDays),
    ease_factor: word.ease_factor,
  }
}

export function isDue(word: Word, now: Date): boolean {
  if (word.next_review_at === null) {
    return true
  }

  return new Date(word.next_review_at).getTime() <= now.getTime()
}

function urgencyRank(word: Word, now: Date): [number, number] {
  if (word.next_review_at === null) {
    return [0, 0]
  }

  const reviewAt = new Date(word.next_review_at).getTime()
  const nowMs = now.getTime()

  if (reviewAt <= nowMs) {
    return [1, reviewAt]
  }

  return [2, reviewAt]
}

export function sortByUrgency(words: Word[], now: Date): Word[] {
  return [...words].sort((left, right) => {
    const [leftRank, leftTime] = urgencyRank(left, now)
    const [rightRank, rightTime] = urgencyRank(right, now)

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    return leftTime - rightTime
  })
}
