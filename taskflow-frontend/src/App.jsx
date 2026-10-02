import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Navbar from './component/Navbar.jsx'

function Protected({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="p-10 text-center">Checking auth...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}



export default function App(){
  return <Routes>
    <Navbar/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/signup" element={<Signup/>}/>
    <Route path="/" element={<Protected><div>Dashboard</div></Protected>}/>

  </Routes>
}