import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AppLayout from './layouts/AppLayout'

function RequireAuth({ children }) {
  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>} />
    </Routes>
  )
}
