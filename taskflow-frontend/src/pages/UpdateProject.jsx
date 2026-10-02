import { useState, useEffect, useCallback, useContext } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import { myRole, initials, avatarGradient } from '../component/lookups.js'


export default function UpdateProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects')
      return res.data.data || []
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not load your projects. Please try again.')
      return []
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setLoading(true)
      setErr('')
      setNotice('')
      const list = await loadProjects()
      if (cancelled) return

      setProjects(list)

      if (id) {
        // Id se seedha khola hai — list me se dhundho
        const found = list.find(p => p._id === id) || null
        setProject(found)
        setName(found?.name || '')
        setDescription(found?.description || '')
      }

      setLoading(false)
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [id, loadProjects])

  const select = (p) => {
    setProject(p)
    setName(p.name || '')
    setDescription(p.description || '')
    setErr('')
    setNotice('')
  }

  const role = myRole(project, user?._id)
  const canEdit = role === 'OWNER' || role === 'ADMIN'

  const save = async (e) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Project name cannot be empty.')
      return
    }

    setSaving(true)
    setErr('')
    setNotice('')
    try {
      await api.patch(`/projects/${project._id}`, {
        name: trimmed,
        // Khaali description bhi bhejte hain taaki user use clear kar sake
        description: description.trim(),
      })
      setNotice('Project updated successfully.')
      // List aur local state turant sync karo, warna stale dikhega
      setProjects(prev => prev.map(p => (p._id === project._id ? { ...p, name: trimmed, description: description.trim() } : p)))
      setProject(prev => ({ ...prev, name: trimmed, description: description.trim() }))
      setTimeout(() => navigate(`/projects/${project._id}`), 900)
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not update the project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="skeleton h-9 w-56" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to={project ? `/projects/${project._id}` : '/projects'}
        className="group inline-flex items-center gap-1 text-sm font-semibold text-ink-500 transition hover:text-brand-600"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>{' '}
        {project ? 'Back to project' : 'Back to projects'}
      </Link>

      <h1 className="gradient-text mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Update project
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Change the name and description of your project. Only the owner and admins can do this.
      </p>

      {err && (
        <p className="alert-rose animate-scale-in mt-6 rounded-xl px-3.5 py-2.5 text-sm font-medium" role="alert">
          {err}
        </p>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {/* Project picker — tabhi dikhao jab URL me id nahi hai */}
        {!id && (
          <section>
            <h2 className="font-display text-sm font-bold text-ink-900">Select a project</h2>
            {!projects.length ? (
              <div className="glass mt-3 rounded-2xl p-6 text-center text-sm text-ink-500">
                You have no projects yet.{' '}
                <Link to="/projects" className="font-semibold text-brand-500 underline-offset-4 hover:underline">
                  Create one
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {projects.map(p => {
                  const active = project?._id === p._id
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => select(p)}
                      className={`lift flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-brand-500 bg-white/85 shadow-[0_18px_40px_-24px_rgba(79,70,229,0.95)]'
                          : 'border-white/60 bg-white/60 hover:border-brand-500/35'
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                        style={{ background: avatarGradient(p.name || p._id) }}
                        aria-hidden="true"
                      >
                        {initials(p.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{p.name}</span>
                        <span className="block truncate text-xs text-ink-500">
                          {p.description || 'No description added yet'}
                        </span>
                      </span>
                      {active && <span className="chip bg-brand-500/12 text-brand-500">Selected</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Form */}
        <section>
          {!project ? (
            <div className="glass grid h-full place-items-center rounded-2xl p-10 text-center">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">No project selected</h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  {id
                    ? 'That project was not found, or it is not shared with you.'
                    : 'Pick a project from the list to edit its details.'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={save} className="glass-strong animate-scale-in rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-ink-900">{project.name}</h2>

              {!canEdit && (
                <p className="mt-3 rounded-lg bg-todo-soft px-3 py-2 text-sm font-medium text-[#92400E]">
                  You are a member of this project, so you can view but not edit its details.
                </p>
              )}

              <div className="mt-5 grid gap-4">
                <div>
                  <label
                    htmlFor="up-name"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-500"
                  >
                    Project name
                  </label>
                  <input
                    id="up-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={80}
                    disabled={!canEdit}
                    required
                    className="field"
                  />
                </div>

                <div>
                  <label
                    htmlFor="up-desc"
                    className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-500"
                  >
                    Description
                  </label>
                  <textarea
                    id="up-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    maxLength={400}
                    disabled={!canEdit}
                    placeholder="What is this project about?"
                    className="field resize-none"
                  />
                  <p className="tnum mt-1 text-right text-[11px] text-ink-300">
                    {description.length}/400
                  </p>
                </div>
              </div>

              {notice && (
                <p
                  className="mt-4 animate-scale-in rounded-lg bg-done-soft px-3 py-2 text-sm font-medium text-[#047857]"
                  role="status"
                >
                  {notice}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Link
                  to={`/projects/${project._id}`}
                  className="btn-chip border border-ink-900/12 px-4 py-2 text-sm font-semibold text-ink-500 transition hover:border-ink-900/30"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !canEdit}
                  className="btn-gradient rounded-xl px-5 py-2 text-sm font-semibold"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
