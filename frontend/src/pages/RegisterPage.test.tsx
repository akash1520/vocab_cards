import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { getToken } from '../auth/tokenStorage'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { sampleUser } from '../test/authFixtures'
import { RegisterPage } from './RegisterPage'

describe('RegisterPage', () => {
  it('creates an account and signs in', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/auth/register', async () =>
        HttpResponse.json(sampleUser, { status: 201 }),
      ),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ access_token: 'token-1', token_type: 'bearer' }),
      ),
      http.get('/api/auth/me', () => HttpResponse.json(sampleUser)),
    )

    renderWithRouter(<RegisterPage />, { route: '/register' })

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(getToken()).toBe('token-1')
    })
  })

  it('shows a validation error when passwords do not match', async () => {
    const user = userEvent.setup()

    renderWithRouter(<RegisterPage />, { route: '/register' })

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different-password')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeVisible()
  })
})
