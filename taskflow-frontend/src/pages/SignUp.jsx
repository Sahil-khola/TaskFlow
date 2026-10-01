import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await api.post('/auth/signup', { name, email, password })
      // Signup ke baad cookie set nahi hota (sirf login me hota hai),
      // isliye turant login karke cookie le lo, warna /auth/me 401 dega
      await login(email, password)
      navigate('/')
    } catch (er) {
      setErr(er.response?.data?.msg || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl animate-drift-a" style={{ background: 'rgba(217,70,239,0.32)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 bottom-4 h-80 w-80 rounded-full blur-3xl animate-drift-b" style={{ background: 'rgba(99,102,241,0.35)' }} aria-hidden="true" />

      <form
        onSubmit={submit}
        className="glass-strong relative w-full max-w-md rounded-3xl p-8 sm:p-10 animate-scale-in"
        style={{ boxShadow: '0 40px 90px -40px rgba(168,85,247,0.7)' }}
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl font-display text-base font-extrabold text-white"
            style={{
              backgroundImage: 'linear-gradient(135deg,#D946EF,#6366F1)',
              boxShadow: '0 18px 34px -16px rgba(217,70,239,1)',
            }}
            aria-hidden="true"
          >
            TF
          </span>
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.2em] gradient-text">
            TaskFlow
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">
            Spin up projects, invite teammates and ship work faster.
          </p>
        </div>

        {err && (
          <p className="alert-rose mt-6 rounded-xl px-3.5 py-2.5 text-sm font-medium animate-scale-in">
            {err}
          </p>
        )}

        <div className="mt-6 grid gap-3.5">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Full name
            </span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
              className="field"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Email</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              type="email"
              required
              autoComplete="email"
              className="field"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
              autoComplete="new-password"
              className="field"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gradient mt-7 w-full rounded-xl py-3 text-sm font-semibold"
        >
          {loading ? 'Creating your account…' : 'Create account'}
        </button>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-500 underline-offset-4 transition hover:text-brand-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
