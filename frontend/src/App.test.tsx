import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, it, expect } from 'vitest'
import App from './App'
import { renderWithRouter } from './test/renderWithRouter'
import { server } from './test/mswServer'
import { sampleUser } from './test/authFixtures'

describe('App smoke test', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(sampleUser)),
      http.get('/api/words/due', () => HttpResponse.json([])),
    )
  })

  it('renders the vocab cards app shell with routed layout', async () => {
    renderWithRouter(<App />, { route: '/', authToken: 'token-1' })

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: /^study$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add words/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })
})
