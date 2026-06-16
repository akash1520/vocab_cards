import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { sampleAdminUser } from '../test/authFixtures'
import { AdminPage } from './AdminPage'

describe('AdminPage', () => {
  it('renders the user summary table', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(sampleAdminUser)),
      http.get('/api/admin/users', () =>
        HttpResponse.json([
          {
            ...sampleAdminUser,
            word_count: 12,
            due_count: 3,
          },
        ]),
      ),
    )

    renderWithRouter(<AdminPage />, {
      route: '/admin',
      authToken: 'admin-token',
    })

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeVisible()
    })

    expect(screen.getByText('admin@example.com')).toBeVisible()
    expect(screen.getByText('12')).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
  })
})
