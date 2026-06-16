import { Link } from 'react-router-dom'
import { FlashCard } from '../components/FlashCard/FlashCard'
import { StudyControls } from '../components/StudyControls/StudyControls'
import { useStudySession } from '../hooks/useStudySession'
import './StudyPage.css'

export function StudyPage() {
  const {
    currentWord,
    currentIndex,
    total,
    isLoading,
    isFlipped,
    setIsFlipped,
    emptyMessage,
    error,
    markKnown,
    markLearning,
  } = useStudySession()

  return (
    <main className="study-page">
      <div className="study-page__header">
        <Link className="study-page__link" to="/add-words">
          Add words
        </Link>
      </div>

      {isLoading ? <p className="study-page__status">Loading study queue...</p> : null}

      {!isLoading && error ? (
        <p className="study-page__status study-page__status--error" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && currentWord ? (
        <>
          <FlashCard word={currentWord} onFlipChange={setIsFlipped} />
          <StudyControls
            isFlipped={isFlipped}
            currentIndex={currentIndex}
            total={total}
            onKnow={() => void markKnown()}
            onLearning={() => void markLearning()}
          />
        </>
      ) : null}

      {!isLoading && !error && !currentWord ? (
        <p className="study-page__status">{emptyMessage}</p>
      ) : null}
    </main>
  )
}
