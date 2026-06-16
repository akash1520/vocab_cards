import { useCallback, useEffect, useState } from 'react'
import { getDueWords, submitReview } from '../api/wordsApi'
import type { Word } from '../api/types'

export const EMPTY_STUDY_MESSAGE =
  'No words due — add some or check back later'

export function useStudySession() {
  const [words, setWords] = useState<Word[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadDueWords() {
      setIsLoading(true)
      setError(null)

      try {
        const dueWords = await getDueWords()
        if (!isActive) {
          return
        }

        setWords(dueWords)
        setQueueIndex(0)
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setWords([])
        setQueueIndex(0)
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Request failed with status 0',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadDueWords()

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

    await submitReview(currentWord.id, { knew_it: true })
    advanceQueue()
  }, [advanceQueue, currentWord])

  const markLearning = useCallback(async () => {
    if (!currentWord) {
      return
    }

    await submitReview(currentWord.id, { knew_it: false })
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
