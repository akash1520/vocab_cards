export const APP_BRAND = 'Vocab Cards'

export type AppNavItem = {
  to: string
  label: string
  end?: boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { to: '/', label: 'Study', end: true },
  { to: '/add-words', label: 'Add words' },
]
