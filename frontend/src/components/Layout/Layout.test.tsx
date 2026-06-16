import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { Layout } from './Layout'
import { renderWithRouter } from '../../test/renderWithRouter'
import { server } from '../../test/mswServer'
import { sampleAdminUser, sampleUser } from '../../test/authFixtures'

describe('Layout', () => {
  it('renders login and register links when logged out', async () => {
    renderWithRouter(
      <Layout>
        <p>Page content</p>
      </Layout>,
      { route: '/' },
    )

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeVisible()
    })

    expect(screen.getByRole('link', { name: /^login$/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(screen.getByText('Page content')).toBeVisible()
  })

  it('renders study and add words navigation links when logged in', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(sampleUser)))

    renderWithRouter(
      <Layout>
        <p>Page content</p>
      </Layout>,
      { route: '/', authToken: 'token-1' },
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^study$/i })).toBeVisible()
    })

    expect(screen.getByRole('link', { name: /^study$/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /add words/i })).toHaveAttribute(
      'href',
      '/add-words',
    )
    expect(screen.getByRole('button', { name: /logout/i })).toBeVisible()
  })

  it('shows the admin link for admin users', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(sampleAdminUser)))

    renderWithRouter(
      <Layout>
        <p>Admin page</p>
      </Layout>,
      { route: '/admin', authToken: 'admin-token' },
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^admin$/i })).toBeVisible()
    })
  })

  it('highlights the active study route', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(sampleUser)))

    renderWithRouter(
      <Layout>
        <p>Study page</p>
      </Layout>,
      { route: '/', authToken: 'token-1' },
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^study$/i })).toHaveAttribute(
        'aria-current',
        'page',
      )
    })

    expect(screen.getByRole('link', { name: /add words/i })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
