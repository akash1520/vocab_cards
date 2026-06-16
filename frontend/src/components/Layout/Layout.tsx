import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import './Layout.css'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <nav className="layout__nav" aria-label="Main navigation">
        <span className="layout__brand">Vocab Cards</span>
        <div className="layout__links">
          <NavLink className="layout__link" to="/" end>
            Study
          </NavLink>
          <NavLink className="layout__link" to="/add-words">
            Add words
          </NavLink>
        </div>
      </nav>
      {children}
    </div>
  )
}
