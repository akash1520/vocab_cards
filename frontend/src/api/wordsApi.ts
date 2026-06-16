import type { CreateWordInput, ReviewPayload, Word } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

type ErrorBody = {
  detail?: string | unknown
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  const body = (await response.json().catch(() => null)) as ErrorBody | null
  const message =
    typeof body?.detail === 'string'
      ? body.detail
      : `Request failed with status ${response.status}`

  throw new Error(message)
}

export async function getDueWords(limit = 20): Promise<Word[]> {
  const response = await fetch(apiUrl(`/api/words/due?limit=${limit}`))
  return parseResponse<Word[]>(response)
}

export async function createWord(input: CreateWordInput): Promise<Word> {
  const response = await fetch(apiUrl('/api/words'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return parseResponse<Word>(response)
}

export async function submitReview(
  wordId: string,
  payload: ReviewPayload,
): Promise<Word> {
  const response = await fetch(apiUrl(`/api/words/${wordId}/review`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Word>(response)
}
