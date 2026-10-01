import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import EmptyState from '../component/EmptyState.jsx'
import {
  formatDate,
  isOverdue,
  myRole,
  priorityMeta,
  roleMeta,
  statusMeta,
} from '../component/lookups.js'

const cards = [
  {
    to: '/projects',
    title: 'Projects',
    icon: '◧',
    text: 'Browse your projects and start something new',
    gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
    glow: 'glow-indigo',
    ring: 'rgba(99,102,241,0.16)',
  },
  {
    to: '/my-tasks',
    title: 'My Tasks',
    icon: '✓',
    text: 'Everything assigned to you, with overdue work highlighted',
    gradient: 'linear-gradient(135deg,#06B6D4,#0EA5E9)',
    glow: 'glow-cyan',
    ring: 'rgba(6,182,212,0.16)',
  },
]

function SectionHead({ title, to, linkLabel }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
      {to && (
        <Link
          to={to}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-500 transition hover:text-brand-600"
        >
          {linkLabel}
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Projects aur tasks dono ek saath lo — dono ke liye loading state share hai
  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/tasks/my')])
      .then(([p, t]) => {
        setProjects(p.data.data || [])
        setTasks(t.data.data || [])
        setErr('')
      })
      .catch(e => setErr(e.response?.data?.msg || 'We could not load your dashboard. Please refresh and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const overdue = tasks.filter(isOverdue).length
  const pending = tasks.filter(t => t.status !== 'DONE').length
  const done = tasks.length - pending

  const tiles = [
    { label: 'Pending', value: pending, accent: '#4F46E5', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.22)' },
    { label: 'Done', value: done, accent: '#059669', bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.26)' },
    overdue > 0
      ? { label: 'Overdue', value: overdue, accent: '#E11D48', bg: 'rgba(225,29,72,0.10)', border: 'rgba(225,29,72,0.32)' }
      : { label: 'Overdue', value: 0, accent: '#64748B', bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.18)' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-9">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Overview</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="gradient-text">Welcome back</span>, {user?.name || 'there'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">{user?.email}</p>
      </header>

      {err && (
        <p className="alert-rose mt-5 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in">{err}</p>
      )}

      {/* Stat cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 stagger">
        {cards.map(c => (
          <Link
            key={c.to}
            to={c.to}
            className={`glass lift ${c.glow} group flex items-start gap-4 rounded-2xl p-5`}
            style={{ boxShadow: `0 1px 0 0 rgba(255,255,255,0.7) inset, 0 10px 30px -12px rgba(30,27,75,0.18)` }}
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl font-bold text-white transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: c.gradient, boxShadow: `0 14px 26px -14px ${c.ring}` }}
              aria-hidden="true"
            >
              {c.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-500">{c.title}</span>
              <span className="mt-0.5 block font-display text-4xl font-extrabold tnum text-ink-900">
                {loading ? '—' : c.value}
              </span>
              <span className="mt-1.5 block text-sm text-ink-500">{c.text}</span>
            </span>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="mt-9">
          <div className="skeleton h-6 w-40" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
          <div className="skeleton mt-8 h-6 w-36" />
          <div className="mt-4 grid gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Task summary tiles */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3 stagger">
            {tiles.map(t => (
              <div
                key={t.label}
                className="glass flex items-center justify-between rounded-2xl px-5 py-4"
                style={{ background: t.bg, borderColor: t.border }}
              >
                <span className="text-sm font-semibold text-ink-500">{t.label}</span>
                <span className="font-display text-2xl font-extrabold tnum" style={{ color: t.accent }}>
                  {t.value}
                </span>
              </div>
            ))}
          </div>

          {/* Saare projects yahin render karo */}
          <section className="mt-10">
            <SectionHead title="Projects" to="/projects" linkLabel="View all" />

            {!projects.length ? (
              <EmptyState
                icon="◧"
                title="No projects yet"
                body="Projects are where your team tracks work. Create your first one to get the board rolling."
                action={
                  <Link to="/projects" className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold">
                    Create your first project
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {projects.map(p => {
                  const r = roleMeta(myRole(p, user?._id))
                  const members = (p.members || []).length
                  return (
                    <Link
                      key={p._id}
                      to={`/projects/${p._id}`}
                      className="glass lift glow-violet group flex flex-col rounded-2xl p-5"
                    >
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
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="text-xs font-medium text-ink-500">
                          {members} member{members > 1 ? 's' : ''}
                        </span>
                        <span
                          className="h-1.5 w-12 rounded-full"
                          style={{
                            backgroundImage: 'linear-gradient(90deg,#6366F1,#D946EF,#06B6D4)',
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recent tasks */}
          <section className="mt-10">
            <SectionHead title="Recent tasks" to="/my-tasks" linkLabel="View all" />
            {!tasks.length ? (
              <EmptyState
                icon="✓"
                title="Nothing assigned to you"
                body="Once a teammate assigns you a task it will show up here, along with anything that slips past its due date."
              />
            ) : (
              <div className="glass divide-y divide-white/60 overflow-hidden rounded-2xl">
                {tasks.slice(0, 5).map(t => {
                  const meta = statusMeta(t.status)
                  const prio = priorityMeta(t.priority)
                  const late = isOverdue(t)
                  return (
                    <Link
                      key={t._id}
                      to={`/projects/${t.projectId?._id ?? t.projectId}`}
                      className={`flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-white/70 ${
                        late ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-semibold ${
                            t.status === 'DONE' ? 'text-ink-300 line-through' : 'text-ink-900'
                          }`}
                        >
                          {t.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500">
                          {t.projectId?.name}
                          {t.dueDate && (
                            <span className={late ? 'font-semibold text-prio-high' : ''}>
                              {' · '}
                              {late ? 'Overdue ' : 'Due '}
                              {formatDate(t.dueDate)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        className="chip shrink-0"
                        style={{ color: prio.text, background: prio.bg, border: `1px solid ${prio.border}` }}
                      >
                        {prio.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
