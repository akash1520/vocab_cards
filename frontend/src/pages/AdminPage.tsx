import { useEffect, useState } from 'react'
import { getAdminUsers } from '../api/authApi'
import type { AdminUserSummary } from '../api/authTypes'
import '../styles/pageShell.css'
import './AdminPage.css'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadUsers() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getAdminUsers()
        if (isActive) {
          setUsers(data)
        }
      } catch (loadError) {
        if (isActive) {
          setUsers([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load users.',
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <main className="page-shell">
      <h1 className="page-title">Admin dashboard</h1>

      {isLoading ? <p className="page-status">Loading users…</p> : null}
      {error ? <p className="page-status page-status--error">{error}</p> : null}

      {!isLoading && !error ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Words</th>
              <th scope="col">Due</th>
              <th scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td className="admin-table__role">{user.role}</td>
                <td>{user.word_count}</td>
                <td>{user.due_count}</td>
                <td>{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}
