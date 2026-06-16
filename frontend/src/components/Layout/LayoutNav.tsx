import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { APP_BRAND, getAppNavItems } from './navigation'
import './Layout.css'

export function LayoutNav() {
  const { user, logout } = useAuth()
  const navItems = getAppNavItems(user)

  return (
    <nav className="layout__nav" aria-label="Main navigation">
      <span className="layout__brand">{APP_BRAND}</span>
      <div className="layout__links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className="layout__link"
            to={item.to}
            end={item.end}
          >
            {item.label}
          </NavLink>
        ))}
        {user ? (
          <button className="layout__link layout__logout" type="button" onClick={logout}>
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  )
}
