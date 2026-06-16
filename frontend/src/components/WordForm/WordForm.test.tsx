import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CreateWordInput } from '../../api/types'
import { WordForm } from './WordForm'

const validInput: CreateWordInput = {
  term: 'ephemeral',
  part_of_speech: 'adjective',
  definition: 'lasting a very short time',
  synonyms: ['fleeting', 'transient'],
  example_sentence:
    'The ephemeral beauty of cherry blossoms draws crowds each spring.',
}

describe('WordForm', () => {
  it('shows inline validation errors for required fields', async () => {
    const user = userEvent.setup()

    render(<WordForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /add word/i }))

    expect(screen.getByText(/term is required/i)).toBeVisible()
    expect(screen.getByText(/part of speech is required/i)).toBeVisible()
    expect(screen.getByText(/definition is required/i)).toBeVisible()
    expect(screen.getByText(/example sentence is required/i)).toBeVisible()
  })

  it('parses comma-separated synonyms into an array', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<WordForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^term$/i), validInput.term)
    await user.type(
      screen.getByLabelText(/part of speech/i),
      validInput.part_of_speech,
    )
    await user.type(screen.getByLabelText(/^definition$/i), validInput.definition)
    await user.type(
      screen.getByLabelText(/^synonyms$/i),
      'fleeting, transient',
    )
    await user.type(
      screen.getByLabelText(/example sentence/i),
      validInput.example_sentence,
    )
    await user.click(screen.getByRole('button', { name: /add word/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(validInput)
    })
  })

  it('calls onSubmit with form values when validation passes', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(<WordForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^term$/i), validInput.term)
    await user.type(
      screen.getByLabelText(/part of speech/i),
      validInput.part_of_speech,
    )
    await user.type(screen.getByLabelText(/^definition$/i), validInput.definition)
    await user.type(
      screen.getByLabelText(/example sentence/i),
      validInput.example_sentence,
    )
    await user.click(screen.getByRole('button', { name: /add word/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        ...validInput,
        synonyms: undefined,
      })
    })
  })
})
