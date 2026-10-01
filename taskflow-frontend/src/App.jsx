import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'

function Protected({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="p-10 text-center">Checking auth...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Dashboard(){
  const { user, logout } = useContext(AuthContext)
  return <div className="p-10">
    <h1 className="text-2xl">Dashboard ✅</h1>
    <p className="mt-2">Logged in as <b>{user?.name}</b> ({user?.email})</p>
    <button onClick={logout} className="mt-4 border px-3 py-1 rounded">Logout</button>
  </div>
}

export default function App(){
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/" element={<Protected><Dashboard/></Protected>}/>
  </Routes>
}