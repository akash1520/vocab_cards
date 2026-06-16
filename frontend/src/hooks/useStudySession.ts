import { useCallback, useEffect, useState } from 'react'
import type { Word } from '../api/types'
import { loadDueWords } from './loadDueWords'
import { EMPTY_STUDY_MESSAGE } from './messages'
import { reviewWord } from './reviewWord'
import type { StudySession } from './types'

export { EMPTY_STUDY_MESSAGE } from './messages'
export type { StudySession } from './types'

export function useStudySession(): StudySession {
  const [words, setWords] = useState<Word[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function fetchDueWords() {
      setIsLoading(true)
      setError(null)

      const result = await loadDueWords()
      if (!isActive) {
        return
      }

      if (result.ok) {
        setWords(result.words)
        setQueueIndex(0)
      } else {
        setWords([])
        setQueueIndex(0)
        setError(result.error)
      }

      setIsLoading(false)
    }

    void fetchDueWords()

    return () => {
      isActive = false
    }
  }, [])

  const currentWord = words[queueIndex] ?? null
  const total = words.length
  const currentIndex = currentWord ? queueIndex + 1 : 0

  const advanceQueue = useCallback(() => {
    setIsFlipped(false)
    setQueueIndex((index) => index + 1)
  }, [])

  const markKnown = useCallback(async () => {
    if (!currentWord) {
      return
    }

    await reviewWord(currentWord, true)
    advanceQueue()
  }, [advanceQueue, currentWord])

  const markLearning = useCallback(async () => {
    if (!currentWord) {
      return
    }

    await reviewWord(currentWord, false)
    advanceQueue()
  }, [advanceQueue, currentWord])

  return {
    currentWord,
    currentIndex,
    total,
    isLoading,
    isFlipped,
    setIsFlipped,
    emptyMessage: EMPTY_STUDY_MESSAGE,
    error,
    markKnown,
    markLearning,
  }
}
