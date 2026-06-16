import { useCallback, useEffect, useState } from 'react'
import type { Word } from '../api/types'
import { loadDueWords } from './loadDueWords'
import { EMPTY_STUDY_MESSAGE } from './messages'
import { reviewWord } from './reviewWord'
import type { StudySession } from './types'

export { EMPTY_STUDY_MESSAGE } from './messages'
export type { StudySession } from './types'

const REQUEUE_STACK_THRESHOLD = 10

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

  const removeCurrentFromQueue = useCallback(() => {
    setWords((queue) => queue.filter((_, index) => index !== queueIndex))
    setIsFlipped(false)
  }, [queueIndex])

  const rotateCurrentToBack = useCallback(() => {
    setWords((queue) => {
      const next = [...queue]
      const [card] = next.splice(queueIndex, 1)
      next.push(card)
      return next
    })
    setIsFlipped(false)
  }, [queueIndex])

  const markKnown = useCallback(async () => {
    if (!currentWord) {
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7930/ingest/783e0d73-e43a-4bf7-ab22-f70f31055d00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c28540'},body:JSON.stringify({sessionId:'c28540',location:'useStudySession.ts:markKnown:before',message:'markKnown before',data:{wordId:currentWord.id,term:currentWord.term,queueIndex,queueLength:words.length,queueTerms:words.map((w)=>w.term)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    await reviewWord(currentWord, true)
    removeCurrentFromQueue()

    // #region agent log
    fetch('http://127.0.0.1:7930/ingest/783e0d73-e43a-4bf7-ab22-f70f31055d00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c28540'},body:JSON.stringify({sessionId:'c28540',location:'useStudySession.ts:markKnown:after',message:'markKnown after remove',data:{wordId:currentWord.id,queueIndex},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [currentWord, queueIndex, removeCurrentFromQueue, words])

  const markLearning = useCallback(async () => {
    if (!currentWord) {
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7930/ingest/783e0d73-e43a-4bf7-ab22-f70f31055d00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c28540'},body:JSON.stringify({sessionId:'c28540',location:'useStudySession.ts:markLearning:before',message:'markLearning before',data:{wordId:currentWord.id,term:currentWord.term,queueIndex,queueLength:words.length,queueTerms:words.map((w)=>w.term)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    await reviewWord(currentWord, false)

    if (words.length < REQUEUE_STACK_THRESHOLD) {
      rotateCurrentToBack()
    } else {
      removeCurrentFromQueue()
    }

    // #region agent log
    fetch('http://127.0.0.1:7930/ingest/783e0d73-e43a-4bf7-ab22-f70f31055d00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c28540'},body:JSON.stringify({sessionId:'c28540',location:'useStudySession.ts:markLearning:after',message:'markLearning after rotate/remove',data:{wordId:currentWord.id,queueIndex,requeued:words.length<REQUEUE_STACK_THRESHOLD},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }, [currentWord, queueIndex, removeCurrentFromQueue, rotateCurrentToBack, words])

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
