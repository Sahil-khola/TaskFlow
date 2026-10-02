import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'


export function BrandLoader({ label = 'Checking your session…' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 animate-fade-in">
      <div className="relative h-16 w-16">
        <span
          className="absolute inset-0 rounded-2xl opacity-70 blur-md animate-glow-pulse"
          style={{ backgroundImage: 'linear-gradient(135deg,#6366F1,#D946EF)' }}
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 rounded-2xl animate-spin [animation-duration:1.1s]"
          style={{
            backgroundImage:
              'conic-gradient(from 0deg, #4F46E5, #A855F7, #D946EF, #06B6D4, #4F46E5)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '3px',
          }}
          aria-hidden="true"
        />
        <span
          className="absolute inset-0.75 grid place-items-center rounded-[13px] bg-white/85 backdrop-blur font-display text-sm font-extrabold text-ink-900"
          aria-hidden="true"
        >
          TF
        </span>
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-extrabold tracking-tight gradient-text">TaskFlow</p>
        <p className="mt-1 text-sm text-ink-500 animate-pulse-soft">{label}</p>
      </div>
    </div>
  )
}

export default function Protected({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <BrandLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}
