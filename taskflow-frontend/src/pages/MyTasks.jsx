import { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import EmptyState from '../component/EmptyState.jsx'
import {
  avatarGradient,
  formatDate,
  initials,
  isOverdue,
  priorityMeta,
  statusMeta,
} from '../component/lookups.js'

export default function MyTasks() {
  const { user } = useContext(AuthContext)
  const [tasks, setTasks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showDone, setShowDone] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/tasks/my')
      .then(res => { setTasks(res.data.data || []); setErr('') })
      .catch(e => setErr(e.response?.data?.msg || 'We could not load your tasks. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const overdue = (tasks || []).filter(isOverdue).length
  const visible = (tasks || []).filter(t => showDone || t.status !== 'DONE')

  const tiles = [
    {
      label: 'Total',
      value: (tasks || []).length,
      accent: '#4F46E5',
      gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
      bg: 'rgba(79,70,229,0.08)',
      border: 'rgba(79,70,229,0.24)',
    },
    overdue > 0
      ? {
          label: 'Overdue',
          value: overdue,
          accent: '#E11D48',
          gradient: 'linear-gradient(135deg,#E11D48,#F59E0B)',
          bg: 'rgba(225,29,72,0.10)',
          border: 'rgba(225,29,72,0.34)',
        }
      : {
          label: 'Overdue',
          value: 0,
          accent: '#64748B',
          gradient: 'linear-gradient(135deg,#64748B,#94A3B8)',
          bg: 'rgba(100,116,139,0.07)',
          border: 'rgba(100,116,139,0.20)',
        },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-9">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Assignments</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight gradient-text sm:text-4xl">
            My Tasks
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Everything assigned to {user?.name || 'you'}, across every project.
          </p>
        </div>

        {/* Switch-style "show completed" toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={showDone}
          onClick={() => setShowDone(v => !v)}
          className="glass group flex items-center gap-3 rounded-full py-2 pl-3 pr-2.5 text-sm font-semibold text-ink-700 transition hover:-translate-y-0.5"
        >
          Show completed
          <span
            className="relative h-6 w-11 shrink-0 rounded-full transition-all duration-300"
            style={{
              backgroundImage: showDone
                ? 'linear-gradient(120deg,#4F46E5,#7C3AED)'
                : 'linear-gradient(120deg,#CBD5E1,#94A3B8)',
              boxShadow: showDone ? '0 8px 18px -8px rgba(124,58,237,0.95)' : 'none',
            }}
            aria-hidden="true"
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
              style={{ left: showDone ? '22px' : '2px' }}
            />
          </span>
        </button>
      </header>

      {err && (
        <p className="alert-rose mt-5 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in">{err}</p>
      )}

      {!loading && tasks && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 stagger">
          {tiles.map(t => (
            <div
              key={t.label}
              className="glass flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{ background: t.bg, borderColor: t.border }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white"
                style={{ backgroundImage: t.gradient }}
                aria-hidden="true"
              >
                {t.label === 'Total' ? '✓' : '!'}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-500">{t.label}</span>
                <span className="block font-display text-2xl font-extrabold tnum" style={{ color: t.accent }}>
                  {t.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : !visible.length ? (
        <div className="mt-6">
          <EmptyState
            icon="✓"
            title={tasks?.length ? 'All caught up' : 'No tasks assigned yet'}
            body={
              tasks?.length
                ? 'Every task assigned to you is done. Nice work — turn the toggle back on to see them.'
                : 'When a teammate assigns you a task it will appear here, with anything overdue highlighted in rose.'
            }
            action={
              tasks?.length ? (
                <button onClick={() => setShowDone(true)} className="btn-outline rounded-xl px-5 py-2.5 text-sm font-semibold">
                  Show completed
                </button>
              ) : (
                <Link to="/projects" className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold">
                  Browse projects
                </Link>
              )
            }
          />
        </div>
      ) : (
        <ul className="glass mt-6 grid gap-2 rounded-2xl p-2 stagger">
          {visible.map(t => {
            const meta = statusMeta(t.status)
            const prio = priorityMeta(t.priority)
            const late = isOverdue(t)
            const done = t.status === 'DONE'
            const assignee = t.assigneeId?.name

            return (
              <li
                key={t._id}
                className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/85 ${
                  late ? 'bg-rose-50/70' : done ? 'bg-white/40' : 'bg-white/60'
                }`}
                style={{
                  borderLeft: `3px solid ${late ? '#E11D48' : meta.accent}`,
                }}
              >
                <span
                  className="chip mt-0.5 shrink-0"
                  style={{ color: meta.text, background: meta.soft, border: `1px solid ${meta.accent}44` }}
                >
                  {meta.label}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${
                      done ? 'text-ink-300 line-through' : 'text-ink-900'
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                    {t.projectId?.name && <span>{t.projectId.name}</span>}
                    {t.dueDate && (
                      <span className={late ? 'font-semibold text-prio-high' : ''}>
                        {late ? 'Overdue · ' : 'Due '}
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                  </p>
                </div>

                <span
                  className="chip mt-0.5 shrink-0"
                  style={{ color: prio.text, background: prio.bg, border: `1px solid ${prio.border}` }}
                >
                  {prio.label}
                </span>

                {assignee && (
                  <span className="hidden items-center gap-1.5 shrink-0 text-xs font-medium text-ink-500 sm:flex">
                    <span
                      className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundImage: avatarGradient(assignee) }}
                      aria-hidden="true"
                    >
                      {initials(assignee)}
                    </span>
                    <span className="max-w-[9rem] truncate">{assignee}</span>
                  </span>
                )}

                <Link
                  to={`/projects/${t.projectId?._id ?? t.projectId}`}
                  className="btn-chip btn-outline shrink-0"
                >
                  Open
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
