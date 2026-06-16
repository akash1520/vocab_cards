import type { User } from '../../api/authTypes'

export const APP_BRAND = 'Vocab Cards'

export type AppNavItem = {
  to: string
  label: string
  end?: boolean
}

export function getAppNavItems(user: User | null): AppNavItem[] {
  if (!user) {
    return [
      { to: '/login', label: 'Login' },
      { to: '/register', label: 'Register' },
    ]
  }

  const items: AppNavItem[] = [
    { to: '/', label: 'Study', end: true },
    { to: '/add-words', label: 'Add words' },
  ]

  if (user.role === 'admin') {
    items.push({ to: '/admin', label: 'Admin' })
  }

  return items
}
