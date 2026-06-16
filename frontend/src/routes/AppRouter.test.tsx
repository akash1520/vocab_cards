import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { AppRouter } from './AppRouter'

describe('AppRouter', () => {
  it('renders StudyPage at /', async () => {
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    renderWithRouter(<AppRouter />, { route: '/' })

    await waitFor(() => {
      expect(
        screen.getByText(/no words due — add some or check back later/i),
      ).toBeVisible()
    })
  })

  it('renders AddWordsPage at /add-words', () => {
    renderWithRouter(<AppRouter />, { route: '/add-words' })

    expect(
      screen.getByRole('heading', { name: /add a new word/i }),
    ).toBeVisible()
  })

  it('redirects unknown paths to /', async () => {
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    renderWithRouter(<AppRouter />, { route: '/unknown-path' })

    await waitFor(() => {
      expect(
        screen.getByText(/no words due — add some or check back later/i),
      ).toBeVisible()
    })
  })
})
