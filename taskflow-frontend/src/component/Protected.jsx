import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Protected({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="p-10 text-center">Checking auth...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}