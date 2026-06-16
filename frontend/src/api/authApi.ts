import type {
  AdminUserSummary,
  RegisterInput,
  TokenResponse,
  User,
} from './authTypes'
import { apiGet, apiPost, apiUrl, parseResponse } from './http'

export async function register(input: RegisterInput): Promise<User> {
  return apiPost<User>('/api/auth/register', input)
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    username: email,
    password,
  })

  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  return parseResponse<TokenResponse>(response)
}

export async function getMe(): Promise<User> {
  return apiGet<User>('/api/auth/me')
}

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  return apiGet<AdminUserSummary[]>('/api/admin/users')
}
