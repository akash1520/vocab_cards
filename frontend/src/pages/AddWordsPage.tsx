import { WordForm } from '../components/WordForm/WordForm'
import { useAddWord } from '../hooks/useAddWord'
import { AddWordsPageHeader } from './AddWordsPageHeader'
import './AddWordsPage.css'

export function AddWordsPage() {
  const { successMessage, submitError, submitWord } = useAddWord()

  return (
    <main className="add-words-page">
      <AddWordsPageHeader />

      <h1 className="add-words-page__title">Add a new word</h1>

      {successMessage ? (
        <p className="add-words-page__success" role="status">
          {successMessage}
        </p>
      ) : null}

      <WordForm onSubmit={submitWord} submitError={submitError} />
    </main>
  )
}
