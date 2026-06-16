import './StudyControls.css'

type StudyControlsProps = {
  isFlipped: boolean
  currentIndex: number
  total: number
  onKnow: () => void
  onLearning: () => void
}

export function StudyControls({
  isFlipped,
  currentIndex,
  total,
  onKnow,
  onLearning,
}: StudyControlsProps) {
  const actionsDisabled = !isFlipped

  return (
    <section className="study-controls" aria-label="Study controls">
      <p className="study-controls__progress">
        {currentIndex} / {total}
      </p>
      <div className="study-controls__actions">
        <button
          type="button"
          className="study-controls__button study-controls__button--learning"
          disabled={actionsDisabled}
          onClick={onLearning}
        >
          Still learning
        </button>
        <button
          type="button"
          className="study-controls__button study-controls__button--know"
          disabled={actionsDisabled}
          onClick={onKnow}
        >
          I know this word
        </button>
      </div>
    </section>
  )
}
