import { NavLink } from 'react-router-dom'
import { APP_BRAND, APP_NAV_ITEMS } from './navigation'

export function LayoutNav() {
  return (
    <nav className="layout__nav" aria-label="Main navigation">
      <span className="layout__brand">{APP_BRAND}</span>
      <div className="layout__links">
        {APP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            className="layout__link"
            to={item.to}
            end={item.end}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
