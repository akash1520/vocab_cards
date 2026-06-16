export type UserRole = 'user' | 'admin'

export type User = {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type AdminUserSummary = {
  id: string
  email: string
  role: UserRole
  created_at: string
  word_count: number
  due_count: number
}
