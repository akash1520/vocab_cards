import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CreateWordInput, EnrichWordResponse } from '../../api/types'
import * as wordsApi from '../../api/wordsApi'
import { WordForm } from './WordForm'

const validInput: CreateWordInput = {
  term: 'ephemeral',
  part_of_speech: 'adjective',
  definition: 'lasting a very short time',
  synonyms: ['fleeting', 'transient'],
  example_sentence:
    'The ephemeral beauty of cherry blossoms draws crowds each spring.',
}

const enrichResponse: EnrichWordResponse = {
  term: validInput.term,
  part_of_speech: validInput.part_of_speech,
  definition: validInput.definition,
  synonyms: validInput.synonyms ?? [],
  example_sentence: validInput.example_sentence,
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

  it('prefills fields when Fill with AI succeeds', async () => {
    const user = userEvent.setup()
    const enrichSpy = vi.spyOn(wordsApi, 'enrichWord').mockResolvedValue(enrichResponse)

    render(<WordForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^term$/i), validInput.term)
    await user.click(screen.getByRole('button', { name: /fill with ai/i }))

    await waitFor(() => {
      expect(enrichSpy).toHaveBeenCalledWith('ephemeral')
      expect(screen.getByLabelText(/part of speech/i)).toHaveValue(
        validInput.part_of_speech,
      )
      expect(screen.getByLabelText(/^definition$/i)).toHaveValue(
        validInput.definition,
      )
      expect(screen.getByLabelText(/^synonyms$/i)).toHaveValue(
        'fleeting, transient',
      )
      expect(screen.getByLabelText(/example sentence/i)).toHaveValue(
        validInput.example_sentence,
      )
    })

    enrichSpy.mockRestore()
  })

  it('shows enrich error when Fill with AI fails', async () => {
    const user = userEvent.setup()
    const enrichSpy = vi
      .spyOn(wordsApi, 'enrichWord')
      .mockRejectedValue(
        new Error('Ollama is unreachable. Start Ollama and pull a model.'),
      )

    render(<WordForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^term$/i), 'ephemeral')
    await user.click(screen.getByRole('button', { name: /fill with ai/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/ollama is unreachable/i),
      ).toBeVisible()
    })

    enrichSpy.mockRestore()
  })

  it('requires a term before Fill with AI', async () => {
    const user = userEvent.setup()
    const enrichSpy = vi.spyOn(wordsApi, 'enrichWord')

    render(<WordForm onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /fill with ai/i }))

    expect(screen.getByText(/term is required/i)).toBeVisible()
    expect(enrichSpy).not.toHaveBeenCalled()

    enrichSpy.mockRestore()
  })
})
