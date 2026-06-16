import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { getToken } from '../auth/tokenStorage'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { sampleUser } from '../test/authFixtures'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('submits credentials and stores the access token', async () => {
    const user = userEvent.setup()
    const loginSpy = vi.fn()

    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.text()
        loginSpy(body)
        return HttpResponse.json({ access_token: 'token-1', token_type: 'bearer' })
      }),
      http.get('/api/auth/me', () => HttpResponse.json(sampleUser)),
    )

    renderWithRouter(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(getToken()).toBe('token-1')
    })

    expect(loginSpy).toHaveBeenCalledWith('username=user%40example.com&password=password123')
  })
})
