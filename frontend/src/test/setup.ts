import { afterAll, afterEach, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { clearToken } from '../auth/tokenStorage'
import { server } from './mswServer'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  clearToken()
  server.resetHandlers()
})
afterAll(() => server.close())
