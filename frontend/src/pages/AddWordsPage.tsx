import { WordForm } from '../components/WordForm/WordForm'
import { useAddWord } from '../hooks/useAddWord'
import '../styles/pageShell.css'
import { AddWordsPageHeader } from './AddWordsPageHeader'

export function AddWordsPage() {
  const { successMessage, submitError, submitWord } = useAddWord()

  return (
    <main className="page-shell add-words-page">
      <AddWordsPageHeader />

      <h1 className="page-title">Add a new word</h1>

      {successMessage ? (
        <p className="page-status page-status--success" role="status">
          {successMessage}
        </p>
      ) : null}

      <WordForm onSubmit={submitWord} submitError={submitError} />
    </main>
  )
}
