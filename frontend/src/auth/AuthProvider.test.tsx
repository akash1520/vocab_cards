import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { sampleUser } from '../test/authFixtures'
import App from '../App'

describe('AuthProvider', () => {
  it('logs out and clears the stored token', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(sampleUser)),
      http.get('/api/words/due', () => HttpResponse.json([])),
    )

    renderWithRouter(<App />, { route: '/', authToken: 'token-1' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeVisible()
    })

    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(getToken()).toBeNull()
      expect(screen.getByRole('link', { name: /login/i })).toBeVisible()
    })
  })
})
