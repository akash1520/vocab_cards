import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { sampleWord } from '../test/fixtures'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { AddWordsPage } from './AddWordsPage'

describe('AddWordsPage', () => {
  it('creates a word, shows success, and clears the form', async () => {
    const user = userEvent.setup()
    let createCalled = false

    server.use(
      http.post('/api/words', async ({ request }) => {
        createCalled = true
        const body = await request.json()

        expect(body).toEqual({
          term: 'ephemeral',
          part_of_speech: 'adjective',
          definition: 'lasting a very short time',
          synonyms: ['fleeting', 'transient'],
          example_sentence:
            'The ephemeral beauty of cherry blossoms draws crowds each spring.',
        })

        return HttpResponse.json(
          {
            ...sampleWord,
            id: 'word-new',
            term: 'ephemeral',
            part_of_speech: 'adjective',
            definition: 'lasting a very short time',
            synonyms: ['fleeting', 'transient'],
            example_sentence:
              'The ephemeral beauty of cherry blossoms draws crowds each spring.',
          },
          { status: 201 },
        )
      }),
    )

    renderWithRouter(<AddWordsPage />)

    await user.type(screen.getByLabelText(/^term$/i), 'ephemeral')
    await user.type(screen.getByLabelText(/part of speech/i), 'adjective')
    await user.type(
      screen.getByLabelText(/^definition$/i),
      'lasting a very short time',
    )
    await user.type(screen.getByLabelText(/^synonyms$/i), 'fleeting, transient')
    await user.type(
      screen.getByLabelText(/example sentence/i),
      'The ephemeral beauty of cherry blossoms draws crowds each spring.',
    )
    await user.click(screen.getByRole('button', { name: /add word/i }))

    await waitFor(() => {
      expect(createCalled).toBe(true)
      expect(screen.getByText(/word added successfully/i)).toBeVisible()
    })

    expect(screen.getByLabelText(/^term$/i)).toHaveValue('')
    expect(screen.getByLabelText(/part of speech/i)).toHaveValue('')
    expect(screen.getByLabelText(/^definition$/i)).toHaveValue('')
    expect(screen.getByLabelText(/^synonyms$/i)).toHaveValue('')
    expect(screen.getByLabelText(/example sentence/i)).toHaveValue('')
  })

  it('shows inline errors when the API rejects the request', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/words', () =>
        HttpResponse.json({ detail: 'term is required' }, { status: 422 }),
      ),
    )

    renderWithRouter(<AddWordsPage />)

    await user.type(screen.getByLabelText(/^term$/i), 'ephemeral')
    await user.type(screen.getByLabelText(/part of speech/i), 'adjective')
    await user.type(screen.getByLabelText(/^definition$/i), 'test definition')
    await user.type(screen.getByLabelText(/example sentence/i), 'Example sentence.')
    await user.click(screen.getByRole('button', { name: /add word/i }))

    await waitFor(() => {
      expect(screen.getByText(/term is required/i)).toBeVisible()
    })
  })

  it('shows a link back to study', () => {
    renderWithRouter(<AddWordsPage />)

    expect(screen.getByRole('link', { name: /back to study/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('fills the form with AI suggestions and saves the word', async () => {
    const user = userEvent.setup()
    let createCalled = false

    server.use(
      http.post('/api/words/enrich', async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ term: 'ephemeral' })

        return HttpResponse.json({
          term: 'ephemeral',
          part_of_speech: 'adjective',
          definition: 'lasting a very short time',
          synonyms: ['fleeting', 'transient'],
          example_sentence:
            'The ephemeral beauty of cherry blossoms draws crowds each spring.',
        })
      }),
      http.post('/api/words', async ({ request }) => {
        createCalled = true
        const body = await request.json()

        expect(body).toEqual({
          term: 'ephemeral',
          part_of_speech: 'adjective',
          definition: 'lasting a very short time',
          synonyms: ['fleeting', 'transient'],
          example_sentence:
            'The ephemeral beauty of cherry blossoms draws crowds each spring.',
        })

        return HttpResponse.json(
          {
            ...sampleWord,
            id: 'word-new',
            ...body,
          },
          { status: 201 },
        )
      }),
    )

    renderWithRouter(<AddWordsPage />)

    await user.type(screen.getByLabelText(/^term$/i), 'ephemeral')
    await user.click(screen.getByRole('button', { name: /fill with ai/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/^definition$/i)).toHaveValue(
        'lasting a very short time',
      )
    })

    await user.click(screen.getByRole('button', { name: /add word/i }))

    await waitFor(() => {
      expect(createCalled).toBe(true)
      expect(screen.getByText(/word added successfully/i)).toBeVisible()
    })
  })
})
