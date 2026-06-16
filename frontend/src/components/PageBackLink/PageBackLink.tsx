import { Link } from 'react-router-dom'
import '../../styles/pageShell.css'

type PageBackLinkProps = {
  to: string
  label: string
}

export function PageBackLink({ to, label }: PageBackLinkProps) {
  return (
    <div className="page-back-link__wrap">
      <Link className="page-back-link" to={to}>
        {label}
      </Link>
    </div>
  )
}
