import type { ReactNode } from 'react'
import { LayoutNav } from './LayoutNav'
import './Layout.css'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <LayoutNav />
      {children}
    </div>
  )
}
