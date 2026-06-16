import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { sampleAdminUser, sampleUser } from '../test/authFixtures'
import { AppRouter } from './AppRouter'

function mockAuthenticatedUser(user = sampleUser) {
  server.use(http.get('/api/auth/me', () => HttpResponse.json(user)))
}

describe('AppRouter', () => {
  it('redirects unauthenticated users from / to /login', async () => {
    renderWithRouter(<AppRouter />, { route: '/' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeVisible()
    })
  })

  it('renders StudyPage at / when authenticated', async () => {
    mockAuthenticatedUser()
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    renderWithRouter(<AppRouter />, { route: '/', authToken: 'token-1' })

    await waitFor(() => {
      expect(
        screen.getByText(/no words due — add some or check back later/i),
      ).toBeVisible()
    })
  })

  it('renders AddWordsPage at /add-words when authenticated', async () => {
    mockAuthenticatedUser()

    renderWithRouter(<AppRouter />, { route: '/add-words', authToken: 'token-1' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /add a new word/i }),
      ).toBeVisible()
    })
  })

  it('redirects non-admin users away from /admin', async () => {
    mockAuthenticatedUser(sampleUser)
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    renderWithRouter(<AppRouter />, { route: '/admin', authToken: 'token-1' })

    await waitFor(() => {
      expect(
        screen.getByText(/no words due — add some or check back later/i),
      ).toBeVisible()
    })
  })

  it('renders AdminPage for admin users', async () => {
    mockAuthenticatedUser(sampleAdminUser)
    server.use(
      http.get('/api/admin/users', () =>
        HttpResponse.json([
          {
            ...sampleAdminUser,
            word_count: 0,
            due_count: 0,
          },
        ]),
      ),
    )

    renderWithRouter(<AppRouter />, { route: '/admin', authToken: 'admin-token' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeVisible()
    })
  })
})
