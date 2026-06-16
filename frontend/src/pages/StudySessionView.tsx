import type { Word } from '../api/types'
import { FlashCard } from '../components/FlashCard/FlashCard'
import { StudyControls } from '../components/StudyControls/StudyControls'

type StudySessionViewProps = {
  word: Word
  isFlipped: boolean
  currentIndex: number
  total: number
  onFlipChange: (isFlipped: boolean) => void
  onKnow: () => void
  onLearning: () => void
}

export function StudySessionView({
  word,
  isFlipped,
  currentIndex,
  total,
  onFlipChange,
  onKnow,
  onLearning,
}: StudySessionViewProps) {
  return (
    <>
      <FlashCard
        key={word.id}
        word={word}
        onFlipChange={onFlipChange}
      />
      <StudyControls
        isFlipped={isFlipped}
        currentIndex={currentIndex}
        total={total}
        onKnow={onKnow}
        onLearning={onLearning}
      />
    </>
  )
}
