import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email, password)          // token save + /me internally
      navigate('/')
    } catch (er) {
      // backend "msg" bhejta hai, "message" nahi
      setErr(er.response?.data?.msg || 'Login failed. Please check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* extra local aurora so the auth screens feel richer than the app shell */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl animate-drift-a" style={{ background: 'rgba(99,102,241,0.35)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl animate-drift-b" style={{ background: 'rgba(6,182,212,0.32)' }} aria-hidden="true" />

      <form
        onSubmit={submit}
        className="glass-strong relative w-full max-w-md rounded-3xl p-8 sm:p-10 animate-scale-in"
        style={{ boxShadow: '0 40px 90px -40px rgba(79,70,229,0.75)' }}
      >
        {/* wordmark */}
        <div className="flex flex-col items-center text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl font-display text-base font-extrabold text-white"
            style={{
              backgroundImage: 'linear-gradient(135deg,#4F46E5,#A855F7)',
              boxShadow: '0 18px 34px -16px rgba(124,58,237,1)',
            }}
            aria-hidden="true"
          >
            TF
          </span>
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.2em] gradient-text">
            TaskFlow
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Log in to pick up where you left off.</p>
        </div>

        {err && (
          <p className="alert-rose mt-6 rounded-xl px-3.5 py-2.5 text-sm font-medium animate-scale-in">
            {err}
          </p>
        )}

        <div className="mt-6 grid gap-3.5">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
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
              placeholder="Your password"
              required
              autoComplete="current-password"
              className="field"
            />
          </label>
        </div>

        <button type="submit" disabled={busy} className="btn-gradient mt-7 w-full rounded-xl py-3 text-sm font-semibold">
          {busy ? 'Logging in…' : 'Log in'}
        </button>

        <p className="mt-5 text-center text-sm text-ink-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-brand-500 underline-offset-4 transition hover:text-brand-600 hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
