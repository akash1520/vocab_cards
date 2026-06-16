import { Navigate, Route, Routes } from 'react-router-dom'
import { AddWordsPage } from '../pages/AddWordsPage'
import { StudyPage } from '../pages/StudyPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<StudyPage />} />
      <Route path="/add-words" element={<AddWordsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
