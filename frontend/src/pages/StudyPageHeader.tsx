import { Link } from 'react-router-dom'

export function StudyPageHeader() {
  return (
    <div className="study-page__header">
      <Link className="study-page__link" to="/add-words">
        Add words
      </Link>
    </div>
  )
}
