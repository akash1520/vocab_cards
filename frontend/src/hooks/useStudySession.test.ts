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

  it('markKnown calls review API and advances to the next card', async () => {
    let reviewCalled = false

    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
      http.post('/api/words/word-1/review', async ({ request }) => {
        reviewCalled = true
        const body = (await request.json()) as { knew_it: boolean }

        expect(body).toEqual({ knew_it: true })

        return HttpResponse.json({
          ...sampleWord,
          status: 'learning',
          repetitions: 1,
          interval_days: 1,
          next_review_at: '2026-06-17T12:00:00.000Z',
        })
      }),
    )

    const { result } = renderHook(() => useStudySession())

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(sampleWord)
    })

    await result.current.markKnown()

    await waitFor(() => {
      expect(result.current.currentWord).toEqual(secondWord)
    })
    expect(reviewCalled).toBe(true)
    expect(result.current.currentIndex).toBe(2)
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
