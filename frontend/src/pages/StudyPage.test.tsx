import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { Word } from '../api/types'
import { sampleWord } from '../test/fixtures'
import { renderWithRouter } from '../test/renderWithRouter'
import { server } from '../test/mswServer'
import { StudyPage } from './StudyPage'

const secondWord: Word = {
  ...sampleWord,
  id: 'word-2',
  term: 'ephemeral',
  part_of_speech: 'adjective',
  definition: 'lasting a very short time',
  synonyms: ['fleeting', 'transient'],
  example_sentence:
    'The ephemeral beauty of cherry blossoms draws crowds each spring.',
}

describe('StudyPage', () => {
  it('renders FlashCard and StudyControls wired through the study session', async () => {
    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
    )

    renderWithRouter(<StudyPage />)

    await waitFor(() => {
      expect(screen.getByText('unnerve')).toBeVisible()
    })

    expect(screen.getByText('1 / 2')).toBeVisible()
    expect(screen.getByRole('button', { name: /still learning/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /i know this word/i })).toBeDisabled()
  })

  it('enables study controls after the flashcard is flipped', async () => {
    const user = userEvent.setup()

    server.use(
      http.get('/api/words/due', () => HttpResponse.json([sampleWord, secondWord])),
    )

    renderWithRouter(<StudyPage />)

    await waitFor(() => {
      expect(screen.getByText('unnerve')).toBeVisible()
    })

    await user.click(screen.getByRole('button', { name: /unnerve/i }))

    expect(screen.getByRole('button', { name: /still learning/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /i know this word/i })).toBeEnabled()
  })

  it('shows a link to add words', async () => {
    server.use(http.get('/api/words/due', () => HttpResponse.json([])))

    renderWithRouter(<StudyPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /add words/i }),
      ).toHaveAttribute('href', '/add-words')
    })
  })
})
