import { useState, useRef } from 'react'
import api from '../api/api.js'
import { avatarGradient, initials, roleMeta } from './lookups.js'

/**
 * Project me member add karne ka control.
 *
 * Flow: email type karo -> user search -> result select karo -> role chuno -> Add.
 * Backend me koi "find user by email" endpoint pehle nahi tha, isliye
 * `GET /api/auth/users?email=` use ho raha hai (auth middleware ke peeche).
 *
 * Props:
 *   projectId — kis project me member add karna hai
 *   members   — current members, taaki already-added user dobara na dikhe
 *   onAdded   — add hone ke baad parent ko refresh karne ke liye
 */
export default function AddMember({ projectId, members = [], onAdded }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [role, setRole] = useState('MEMBER')
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const inputRef = useRef(null)

  const reset = () => {
    setEmail('')
    setResults([])
    setSelected(null)
    setRole('MEMBER')
    setErr('')
  }

  const toggle = () => {
    setOpen(o => {
      // Band karte waqt sab reset, taaki next open saaf rahe
      if (o) reset()
      return !o
    })
    setNotice('')
  }

  const search = async (e) => {
    e.preventDefault()
    setErr('')
    setNotice('')

    // Backend 3 character se kam query maanta hai — yahan pehle hi rok dete hain
    if (email.trim().length < 3) {
      setErr('Please enter at least 3 characters.')
      return
    }

    setSearching(true)
    try {
      const res = await api.get('/auth/users', { params: { email: email.trim() } })
      const found = res.data.data || []
      const already = new Set(members.map(m => String(m.userId?._id ?? m.userId)))

      // Jo pehle se member hai unko list me dikhana bekaar hai — hata dete hain
      const fresh = found.filter(u => !already.has(String(u._id)))

      setResults(fresh)
      setSelected(null)

      if (!found.length) setNotice('No accounts match that email.')
      else if (!fresh.length) setNotice('Everyone matching that email is already a member.')
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not search for users. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const add = async (e) => {
    e.preventDefault()
    if (!selected) {
      setErr('Please select a user from the results first.')
      return
    }

    setAdding(true)
    setErr('')
    try {
      await api.post(`/projects/${projectId}/members`, {
        userId: selected._id,
        role,
      })
      setNotice(`${selected.name} was added as ${roleMeta(role).label}.`)
      reset()
      onAdded?.()
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not add that member. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={toggle}
        className="btn-gradient lift glow-indigo inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
      >
        <span
          className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-sm leading-none"
          aria-hidden="true"
        >
          {open ? '×' : '+'}
        </span>
        {open ? 'Close' : 'Add member'}
      </button>

      {open && (
        <div className="glass-strong mt-3 animate-scale-in rounded-2xl p-4">
          <form onSubmit={search} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              ref={inputRef}
              // type="search", type="email" nahi — HTML5 validation poora email maangti hai
              // aur adhoora query (jaise "outsider") pe form submit block kar deti hai
              type="search"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Search by email, e.g. member@taskflow.com"
              aria-label="Search user by email"
              className="field"
            />
            <button type="submit" disabled={searching} className="btn-outline rounded-xl px-5 py-2 text-sm font-semibold">
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {err && (
            <p className="alert-rose mt-3 rounded-lg px-3 py-2 text-sm font-medium" role="alert" aria-live="polite">
              {err}
            </p>
          )}
          {notice && (
            <p className="mt-3 rounded-lg bg-done-soft px-3 py-2 text-sm font-medium text-[#047857]" aria-live="polite">
              {notice}
            </p>
          )}

          {!!results.length && (
            <ul className="mt-3 grid gap-1.5" role="listbox" aria-label="Search results">
              {results.map(u => {
                const active = selected?._id === u._id
                return (
                  <li key={u._id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelected(u)}
                      className={`lift flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-brand-500 bg-brand-500/10 shadow-[0_10px_24px_-16px_rgba(79,70,229,0.9)]'
                          : 'border-transparent bg-white/55 hover:border-brand-500/30'
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                        style={{ background: avatarGradient(u.email || u._id) }}
                        aria-hidden="true"
                      >
                        {initials(u.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{u.name}</span>
                        <span className="block truncate text-xs text-ink-500">{u.email}</span>
                      </span>
                      {active && (
                        <span className="chip bg-brand-500/12 text-brand-500">Selected</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <form onSubmit={add} className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr]">
            <label className="sr-only" htmlFor="member-role">
              Role for the new member
            </label>
            <select
              id="member-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={!selected}
              className="field sm:w-40"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={!selected || adding}
              className="btn-gradient rounded-xl px-5 py-2 text-sm font-semibold"
            >
              {adding ? 'Adding...' : `Add as ${roleMeta(role).label}`}
            </button>
          </form>

          <p className="mt-3 text-xs text-ink-500">
            Admins can edit tasks and manage members. Members can view, comment and update their own tasks.
          </p>
        </div>
      )}
    </div>
  )
}
