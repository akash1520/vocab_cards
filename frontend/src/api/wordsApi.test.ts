import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWord, getDueWords, submitReview } from './wordsApi'
import type { Word } from './types'
import { sampleWord } from '../test/fixtures'

describe('wordsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getDueWords', () => {
    it('calls GET /api/words/due?limit=20 and returns typed words', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify([sampleWord]), { status: 200 }),
      )

      const words = await getDueWords()

      expect(fetch).toHaveBeenCalledWith('/api/words/due?limit=20')
      expect(words).toEqual([sampleWord])
      expect(words[0]?.term).toBe('unnerve')
    })
  })

  describe('createWord', () => {
    it('POSTs JSON body and returns the created word', async () => {
      const input = {
        term: 'ephemeral',
        part_of_speech: 'adjective',
        definition: 'lasting a very short time',
        synonyms: ['fleeting', 'transient'],
        example_sentence: 'The ephemeral beauty of cherry blossoms draws crowds each spring.',
      }

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...sampleWord,
            id: 'word-2',
            term: input.term,
            part_of_speech: input.part_of_speech,
            definition: input.definition,
            synonyms: input.synonyms,
            example_sentence: input.example_sentence,
          }),
          { status: 201 },
        ),
      )

      const created = await createWord(input)

      expect(fetch).toHaveBeenCalledWith('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      expect(created.term).toBe('ephemeral')
    })

    it('throws with server message on 4xx responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'term is required' }), {
          status: 422,
        }),
      )

      await expect(
        createWord({
          term: '',
          part_of_speech: 'noun',
          definition: 'test',
          example_sentence: 'test sentence',
        }),
      ).rejects.toThrow('term is required')
    })
  })

  describe('submitReview', () => {
    it('POSTs knew_it and returns the updated word', async () => {
      const reviewedWord: Word = {
        ...sampleWord,
        status: 'learning',
        repetitions: 1,
        interval_days: 1,
        next_review_at: '2026-06-17T22:00:00.000Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(reviewedWord), { status: 200 }),
      )

      const updated = await submitReview('word-1', { knew_it: true })

      expect(fetch).toHaveBeenCalledWith('/api/words/word-1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knew_it: true }),
      })
      expect(updated).toEqual(reviewedWord)
    })
  })
})
