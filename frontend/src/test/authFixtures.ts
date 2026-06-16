import type { User } from '../api/authTypes'

export const sampleUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
}

export const sampleAdminUser: User = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2026-01-01T00:00:00.000Z',
}
