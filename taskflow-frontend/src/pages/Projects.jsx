import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import EmptyState from '../component/EmptyState.jsx'
import {
  avatarGradient,
  initials,
  memberId,
  myRole,
  roleMeta,
} from '../component/lookups.js'

export default function Projects() {
  const { user } = useContext(AuthContext)
  const [projects, setProjects] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/projects')
      .then(res => { setProjects(res.data.data || []); setErr('') })
      .catch(e => setErr(e.response?.data?.msg || 'We could not load your projects. Please try again.'))
      .finally(() => setLoading(false))
  }

  // Page load hote hi projects fetch karo — bina iske load() kabhi call nahi hota
  // aur screen "Loading projects..." pe atak jata hai
  useEffect(load, [])

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/projects', { name, description })
      setName(''); setDescription(''); setOpen(false)
      load()
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not create that project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-9">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Workspace</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight gradient-text sm:text-4xl">
            Projects
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Every project has its own task board, members and priorities.
          </p>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="btn-gradient rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          {open ? 'Close' : '+ New project'}
        </button>
      </header>

      {err && (
        <p className="alert-rose mt-5 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in">{err}</p>
      )}

      {open && (
        <form
          onSubmit={create}
          className="glass mt-6 grid gap-3.5 rounded-2xl p-5 animate-scale-in"
          style={{ boxShadow: '0 30px 60px -34px rgba(124,58,237,0.75)' }}
        >
          <h2 className="font-display text-base font-bold text-ink-900">New project</h2>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Name</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Website redesign"
              required
              className="field"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Description <span className="normal-case tracking-normal text-ink-300">(optional)</span>
            </span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="field resize-y"
            />
          </label>
          <button type="submit" disabled={saving} className="btn-gradient justify-self-start rounded-xl px-5 py-2.5 text-sm font-semibold">
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-44" />
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="mt-7">
          <EmptyState
            icon="◧"
            title="No projects yet"
            body="A project holds your tasks, teammates and priorities. Start one and it will show up on this board."
            action={
              <button onClick={() => setOpen(true)} className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold">
                Create your first project
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {projects.map((p, i) => {
            const r = roleMeta(myRole(p, user?._id))
            const members = p.members || []
            return (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="glass lift glow-indigo group relative flex flex-col overflow-hidden rounded-2xl p-5"
              >
                {/* top accent line — rotates hue across the grid */}
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  aria-hidden="true"
                  style={{
                    backgroundImage: [
                      'linear-gradient(90deg,#6366F1,#A855F7)',
                      'linear-gradient(90deg,#06B6D4,#6366F1)',
                      'linear-gradient(90deg,#059669,#06B6D4)',
                    ][i % 3],
                  }}
                />

                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover:text-brand-600">
                    {p.name}
                  </h3>
                  <span
                    className="chip shrink-0"
                    style={{ color: r.text, background: r.bg, border: `1px solid ${r.border}` }}
                  >
                    {r.label}
                  </span>
                </div>

                {p.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-500">{p.description}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-ink-300">No description</p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map(m => (
                      <span
                        key={memberId(m)}
                        title={m.userId?.name || 'Member'}
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white"
                        style={{ backgroundImage: avatarGradient(m.userId?.name || memberId(m)) }}
                      >
                        {initials(m.userId?.name)}
                      </span>
                    ))}
                    {members.length > 4 && (
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-white/85 text-[10px] font-bold text-ink-500">
                        +{members.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-ink-500">
                    {members.length} member{members.length > 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
