import type { Word } from '../api/types'

export type StudySession = {
  currentWord: Word | null
  currentIndex: number
  total: number
  isLoading: boolean
  isFlipped: boolean
  setIsFlipped: (isFlipped: boolean) => void
  emptyMessage: string
  error: string | null
  markKnown: () => Promise<void>
  markLearning: () => Promise<void>
}
