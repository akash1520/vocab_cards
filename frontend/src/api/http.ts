import {
  clearToken,
  getToken,
  notifyUnauthorized,
} from '../auth/tokenStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
} as const

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

type ErrorBody = {
  detail?: string | unknown
}

export async function parseResponse<T>(response: Response): Promise<T> {
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

function buildHeaders(headers?: HeadersInit): Headers {
  const next = new Headers(headers)
  const token = getToken()

  if (token) {
    next.set('Authorization', `Bearer ${token}`)
  }

  return next
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: buildHeaders(init?.headers),
  })

  if (response.status === 401) {
    clearToken()
    notifyUnauthorized()
  }

  return response
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await request(path)
  return parseResponse<T>(response)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await request(path, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })

  return parseResponse<T>(response)
}
