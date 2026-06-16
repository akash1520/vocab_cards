import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createWord } from '../api/wordsApi'
import type { CreateWordInput } from '../api/types'
import { WordForm } from '../components/WordForm/WordForm'
import './AddWordsPage.css'

export function AddWordsPage() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(input: CreateWordInput) {
    setSuccessMessage(null)
    setSubmitError(null)

    try {
      await createWord(input)
      setSuccessMessage('Word added successfully')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to add word',
      )
      throw error
    }
  }

  return (
    <main className="add-words-page">
      <div className="add-words-page__header">
        <Link className="add-words-page__link" to="/">
          Back to study
        </Link>
      </div>

      <h1 className="add-words-page__title">Add a new word</h1>

      {successMessage ? (
        <p className="add-words-page__success" role="status">
          {successMessage}
        </p>
      ) : null}

      <WordForm onSubmit={handleSubmit} submitError={submitError} />
    </main>
  )
}
