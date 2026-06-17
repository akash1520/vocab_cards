import type {
  CreateWordInput,
  EnrichWordResponse,
  ReviewPayload,
  Word,
} from './types'
import { apiGet, apiPost } from './http'

export async function getDueWords(limit = 10): Promise<Word[]> {
  return apiGet<Word[]>(`/api/words/due?limit=${limit}`)
}

export async function createWord(input: CreateWordInput): Promise<Word> {
  return apiPost<Word>('/api/words', input)
}

export async function submitReview(
  wordId: string,
  payload: ReviewPayload,
): Promise<Word> {
  return apiPost<Word>(`/api/words/${wordId}/review`, payload)
}

export async function enrichWord(term: string): Promise<EnrichWordResponse> {
  return apiPost<EnrichWordResponse>('/api/words/enrich', { term })
}
