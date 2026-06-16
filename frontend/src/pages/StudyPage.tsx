import { useStudySession } from '../hooks/useStudySession'
import { StudyPageHeader } from './StudyPageHeader'
import { StudyPageStatus } from './StudyPageStatus'
import { StudySessionView } from './StudySessionView'
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

  const showSession = !isLoading && !error && currentWord

  return (
    <main className="study-page">
      <StudyPageHeader />

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
