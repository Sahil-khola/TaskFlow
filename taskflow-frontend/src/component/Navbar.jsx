import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Navbar(){
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path? 'bg-black text-white' : 'hover:bg-gray-100'

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex justify-between items-center">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link to="/" className="font-extrabold text-xl tracking-tight">TaskFlow</Link>
          <div className="hidden md:flex gap-2">
            <Link to="/" className={`px-3 py-1.5 rounded-full text-sm transition ${isActive('/')}`}>Dashboard</Link>
            <Link to="/profile" className={`px-3 py-1.5 rounded-full text-sm transition ${isActive('/profile')}`}>Profile</Link>
          </div>
        </div>

        {/* Right - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-gray-600">Hi, {user?.name?.split(' ')[0]}</span>
          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="text-sm border px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition">Logout</button>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={()=>setOpen(!open)} className="md:hidden border px-3 py-1 rounded">☰</button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t bg-white p-4 space-y-2">
          <Link onClick={()=>setOpen(false)} to="/" className="block py-2">Dashboard</Link>
          <Link onClick={()=>setOpen(false)} to="/profile" className="block py-2">Profile</Link>
          <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">Logout</button>
        </div>
      )}
    </nav>
  )
}