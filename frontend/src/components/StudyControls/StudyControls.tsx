import { STUDY_LABELS } from './labels'
import { StudyActionButton } from './StudyActionButton'
import { StudyProgress } from './StudyProgress'
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
      <StudyProgress currentIndex={currentIndex} total={total} />
      <div className="study-controls__actions">
        <StudyActionButton
          label={STUDY_LABELS.stillLearning}
          variant="learning"
          disabled={actionsDisabled}
          onClick={onLearning}
        />
        <StudyActionButton
          label={STUDY_LABELS.knowWord}
          variant="know"
          disabled={actionsDisabled}
          onClick={onKnow}
        />
      </div>
    </section>
  )
}
