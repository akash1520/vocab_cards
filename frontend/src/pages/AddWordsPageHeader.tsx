import { Link } from 'react-router-dom'

export function AddWordsPageHeader() {
  return (
    <div className="add-words-page__header">
      <Link className="add-words-page__link" to="/">
        Back to study
      </Link>
    </div>
  )
}
