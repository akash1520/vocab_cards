import { useStudySession } from '../hooks/useStudySession'
import '../styles/pageShell.css'
import { StudyPageStatus } from './StudyPageStatus'
import { StudySessionView } from './StudySessionView'

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

  const showSession = !isLoading && !error && currentWord

  return (
    <main className="page-shell study-page">
      {isLoading ? (
        <StudyPageStatus message="Loading study queue..." />
      ) : null}

      {!isLoading && error ? (
        <StudyPageStatus message={error} variant="error" />
      ) : null}

      {showSession ? (
        <StudySessionView
          word={currentWord}
          isFlipped={isFlipped}
          currentIndex={currentIndex}
          total={total}
          onFlipChange={setIsFlipped}
          onKnow={() => void markKnown()}
          onLearning={() => void markLearning()}
        />
      ) : null}

      {!isLoading && !error && !currentWord ? (
        <StudyPageStatus message={emptyMessage} />
      ) : null}
    </main>
  )
}
