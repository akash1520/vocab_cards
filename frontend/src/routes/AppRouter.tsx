import { Navigate, Route, Routes } from 'react-router-dom'
import { AddWordsPage } from '../pages/AddWordsPage'
import { AdminPage } from '../pages/AdminPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { StudyPage } from '../pages/StudyPage'
import { PublicOnly, RequireAdmin, RequireAuth } from './guards'

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <StudyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/add-words"
        element={
          <RequireAuth>
            <AddWordsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
