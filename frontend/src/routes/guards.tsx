import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

type GuardProps = {
  children: ReactNode
}

export function RequireAuth({ children }: GuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p className="page-status">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function RequireAdmin({ children }: GuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p className="page-status">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export function PublicOnly({ children }: GuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p className="page-status">Loading…</p>
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
