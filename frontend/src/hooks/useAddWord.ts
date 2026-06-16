import { useState } from 'react'
import { createWord } from '../api/wordsApi'
import type { CreateWordInput } from '../api/types'

export const ADD_WORD_SUCCESS_MESSAGE = 'Word added successfully'

export function useAddWord() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function submitWord(input: CreateWordInput) {
    setSuccessMessage(null)
    setSubmitError(null)

    try {
      await createWord(input)
      setSuccessMessage(ADD_WORD_SUCCESS_MESSAGE)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to add word',
      )
      throw error
    }
  }

  return {
    successMessage,
    submitError,
    submitWord,
  }
}
