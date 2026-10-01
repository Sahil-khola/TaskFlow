import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import { avatarGradient, initials } from './lookups.js'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/my-tasks', label: 'My Tasks' },
]

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const name = user?.name || user?.email || '?'

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/60 backdrop-blur-xl">
      {/* colourful hairline so the bar does not read as a plain grey rule */}
      <div
        className="h-px w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(99,102,241,0),rgba(99,102,241,0.85),rgba(217,70,239,0.85),rgba(6,182,212,0.85),rgba(99,102,241,0))',
        }}
        aria-hidden="true"
      />
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-6">
        <NavLink to="/" className="group flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              boxShadow: '0 12px 24px -12px rgba(124,58,237,0.95)',
            }}
            aria-hidden="true"
          >
            TF
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">
            TaskFlow
          </span>
        </NavLink>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}                    // "/" sirf dashboard pe active rahe
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-[0_10px_22px_-12px_rgba(124,58,237,0.95)]'
                    : 'text-ink-500 hover:-translate-y-0.5 hover:bg-white/70 hover:text-ink-700'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundImage: 'linear-gradient(120deg,#4F46E5,#7C3AED)' }
                  : undefined
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink-500 sm:inline">{name}</span>
          <span
            className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 hover:scale-105"
            style={{
              backgroundImage: avatarGradient(name),
              boxShadow: '0 10px 20px -10px rgba(79,70,229,0.9)',
            }}
            title={name}
          >
            {initials(name)}
          </span>
          <button onClick={handleLogout} className="btn-outline rounded-full px-3.5 py-2 text-sm font-semibold">
            Logout
          </button>
        </div>
      </nav>
    </header>
  )
}
