import type { Word, WordStatus } from '../api/types'
import {
  LEARNING_INTERVALS_DAYS,
  LEARNING_RETRY_MINUTES,
  MASTERED_INTERVAL_DAYS,
  MASTERED_REPETITIONS,
  MAX_INTERVAL_DAYS,
  MIN_EASE_FACTOR,
  REVIEW_REPETITIONS,
} from './constants'
import { addDays, addMinutes } from './dates'

export type SrsUpdate = Pick<
  Word,
  'status' | 'interval_days' | 'repetitions' | 'next_review_at' | 'ease_factor'
>

function resolveStatus(
  intervalDays: number,
  repetitions: number,
): WordStatus {
  if (intervalDays >= MASTERED_INTERVAL_DAYS && repetitions >= MASTERED_REPETITIONS) {
    return 'mastered'
  }

  if (repetitions >= REVIEW_REPETITIONS) {
    return 'review'
  }

  return 'learning'
}

function buildSrsUpdate(
  word: Word,
  update: Omit<SrsUpdate, 'ease_factor'>,
): SrsUpdate {
  return {
    ...update,
    ease_factor: word.ease_factor,
  }
}

export function computeNextReview(
  word: Word,
  knewIt: boolean,
  now: Date,
): SrsUpdate {
  if (!knewIt) {
    return buildSrsUpdate(word, {
      status: 'learning',
      interval_days: 0,
      repetitions: 0,
      next_review_at: addMinutes(now, LEARNING_RETRY_MINUTES),
    })
  }

  if (word.status === 'review' || word.status === 'mastered') {
    const repetitions = word.repetitions + 1
    const easeFactor = Math.max(word.ease_factor, MIN_EASE_FACTOR)
    const intervalDays = Math.min(
      Math.floor(word.interval_days * easeFactor),
      MAX_INTERVAL_DAYS,
    )

    return buildSrsUpdate(word, {
      status: resolveStatus(intervalDays, repetitions),
      interval_days: intervalDays,
      repetitions,
      next_review_at: addDays(now, intervalDays),
    })
  }

  const repetitions = word.repetitions + 1
  const intervalDays =
    LEARNING_INTERVALS_DAYS[
      Math.min(repetitions - 1, LEARNING_INTERVALS_DAYS.length - 1)
    ]

  return buildSrsUpdate(word, {
    status: resolveStatus(intervalDays, repetitions),
    interval_days: intervalDays,
    repetitions,
    next_review_at: addDays(now, intervalDays),
  })
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
