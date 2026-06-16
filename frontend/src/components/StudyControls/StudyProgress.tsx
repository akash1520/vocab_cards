import { formatStudyProgress } from './formatStudyProgress'

type StudyProgressProps = {
  currentIndex: number
  total: number
}

export function StudyProgress({ currentIndex, total }: StudyProgressProps) {
  return (
    <p className="study-controls__progress">
      {formatStudyProgress(currentIndex, total)}
    </p>
  )
}
