import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Word } from '../api/types'
import { sampleWord } from '../test/fixtures'
import { server } from '../test/mswServer'
import { useStudySession } from './useStudySession'

const secondWord: Word = {
  ...sampleWord,
  id: 'word-2',
  term: 'ephemeral',
  part_of_speech: 'adjective',
  definition: 'lasting a very short time',
  synonyms: ['fleeting', 'transient'],
  example_sentence:
    'The ephemeral beauty of cherry blossoms draws crowds each spring.',
}

describe('useStudySession', () => {
  it('loads due words on mount', async () => {
    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
    )

    const { result } = renderHook(() => useStudySession())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentWord).toEqual(sampleWord)
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.total).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('markKnown removes the card from the session queue without advancing past a gap', async () => {
    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
      http.post('/api/words/word-1/review', () =>
        HttpResponse.json({
          ...sampleWord,
          status: 'learning',
          repetitions: 1,
          interval_days: 1,
          next_review_at: '2026-06-17T12:00:00.000Z',
        }),
      ),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
    })

    await result.current.markKnown()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(secondWord)
      expect(result.current.total).toBe(1)
      expect(result.current.currentIndex).toBe(1)
    })
  })

  it('markLearning calls review API with knew_it false and advances', async () => {
    let reviewCalled = false

    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
      http.post('/api/words/word-1/review', async ({ request }) => {
        reviewCalled = true
        const body = (await request.json()) as { knew_it: boolean }

        expect(body).toEqual({ knew_it: false })

        return HttpResponse.json({
          ...sampleWord,
          status: 'learning',
          repetitions: 0,
          interval_days: 0,
          next_review_at: '2026-06-16T12:10:00.000Z',
        })
      }),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
    })

    await result.current.markLearning()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(secondWord)
    })
    expect(reviewCalled).toBe(true)
    expect(result.current.total).toBe(2)
    expect(result.current.currentIndex).toBe(1)
  })

  it('markLearning rotates the card to the back without duplicating it in the queue', async () => {
    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
      http.post('/api/words/word-1/review', () =>
        HttpResponse.json({
          ...sampleWord,
          status: 'learning',
          repetitions: 0,
          interval_days: 0,
          next_review_at: '2026-06-16T12:10:00.000Z',
        }),
      ),
      http.post('/api/words/word-2/review', () =>
        HttpResponse.json({
          ...secondWord,
          status: 'learning',
          repetitions: 0,
          interval_days: 0,
          next_review_at: '2026-06-16T12:10:00.000Z',
        }),
      ),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
    })

    await result.current.markLearning()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(secondWord)
      expect(result.current.total).toBe(2)
      expect(result.current.currentIndex).toBe(1)
    })

    await result.current.markLearning()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
      expect(result.current.total).toBe(2)
      expect(result.current.currentIndex).toBe(1)
    })
  })

  it('markLearning re-queues the card at the end when the stack has fewer than 10 cards', async () => {
    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord])),
      http.post('/api/words/word-1/review', () =>
        HttpResponse.json({
          ...sampleWord,
          status: 'learning',
          repetitions: 0,
          interval_days: 0,
          next_review_at: '2026-06-16T12:10:00.000Z',
        }),
      ),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
    })

    await result.current.markLearning()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
      expect(result.current.total).toBe(1)
      expect(result.current.currentIndex).toBe(1)
    })
  })

  it('markLearning does not re-queue when the stack already has 10 cards', async () => {
    const tenWords = Array.from({ length: 10 }, (_, index) => ({
      ...sampleWord,
      id: `word-${index + 1}`,
      term: `term-${index + 1}`,
    }))

    server.use(
      http.get('/api/words/due', () => HttpResponse.json(tenWords)),
      http.post('/api/words/word-1/review', () =>
        HttpResponse.json({
          ...tenWords[0],
          status: 'learning',
          repetitions: 0,
          interval_days: 0,
          next_review_at: '2026-06-16T12:10:00.000Z',
        }),
      ),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(tenWords[0])
    })

    await result.current.markLearning()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(tenWords[1])
      expect(result.current.total).toBe(9)
    })
  })

  it('shows an empty message when no words are due', async () => {
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentWord).toBeNull()
    expect(result.current.emptyMessage).toBe(
      'No words due — add some or check back later',
    )
  })

  it('sets an error when loading due words fails', async () => {
    server.use(
      http.get('/api/words/due', () =>
        HttpResponse.json({ detail: 'service unavailable' }, { status: 503 }),
      ),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.error).toBe('service unavailable')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.currentWord).toBeNull()
  })
})
