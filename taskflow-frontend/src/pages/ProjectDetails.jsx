import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '../api/api.js'
import { AuthContext } from '../context/AuthContext.jsx'
import EmptyState from '../component/EmptyState.jsx'
import AddMember from '../component/AddMember.jsx'
import {
  STATUSES,
  avatarGradient,
  formatDate,
  initials,
  isOverdue,
  memberId,
  myRole,
  priorityMeta,
  roleMeta,
} from '../component/lookups.js'

const isColumn = (id) => STATUSES.some(s => s.key === String(id))

/* ------------------------------------------------------------------ card */

function TaskCard({ task, onQuickMove, pending }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id, data: { type: 'task', status: task.status } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <TaskCardBody
      innerRef={setNodeRef}
      style={style}
      task={task}
      onQuickMove={onQuickMove}
      pending={pending}
      dragging={isDragging}
      handleProps={{
        ...attributes,
        ...listeners,
        ref: setActivatorNodeRef,
      }}
    />
  )
}

function TaskCardBody({ task, innerRef, style, onQuickMove, pending, handleProps, dragging, overlay }) {
  const prio = priorityMeta(task.priority)
  const late = isOverdue(task)
  const done = task.status === 'DONE'
  const assignee = task.assigneeId?.name

  return (
    <article
      ref={innerRef}
      style={{
        ...style,
        borderColor: late ? 'rgba(225,29,72,0.38)' : 'rgba(255,255,255,0.65)',
        background: late
          ? 'linear-gradient(140deg,rgba(255,228,230,0.85),rgba(255,255,255,0.8))'
          : 'rgba(255,255,255,0.82)',
        boxShadow: dragging
          ? '0 30px 60px -18px rgba(30,27,75,0.55)'
          : '0 1px 0 0 rgba(255,255,255,0.75) inset, 0 10px 24px -14px rgba(30,27,75,0.28)',
      }}
      className={`relative flex gap-3 overflow-hidden rounded-xl border p-3 pl-4 backdrop-blur-sm ${
        dragging || overlay ? 'drag-lift' : ''
      }`}
    >
      {/* priority bar on the left edge */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundImage: `linear-gradient(180deg, ${prio.bar}, ${prio.bar}55)` }}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h4
            className={`min-w-0 flex-1 text-sm font-semibold ${
              done ? 'text-ink-300 line-through' : 'text-ink-900'
            }`}
          >
            {task.title}
          </h4>
          <button
            type="button"
            {...handleProps}
            aria-label={`Drag ${task.title}`}
            className="-mr-1 -mt-1 shrink-0 cursor-grab touch-none rounded-lg p-1 text-ink-300 transition hover:bg-white/70 hover:text-ink-700 active:cursor-grabbing"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <circle cx="4.5" cy="2.5" r="1.3" />
              <circle cx="9.5" cy="2.5" r="1.3" />
              <circle cx="4.5" cy="7" r="1.3" />
              <circle cx="9.5" cy="7" r="1.3" />
              <circle cx="4.5" cy="11.5" r="1.3" />
              <circle cx="9.5" cy="11.5" r="1.3" />
            </svg>
          </button>
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-500">{task.description}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className="chip"
            style={{ color: prio.text, background: prio.bg, border: `1px solid ${prio.border}` }}
          >
            {prio.label}
          </span>

          {assignee ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 py-0.5 pl-0.5 pr-2">
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundImage: avatarGradient(assignee) }}
                aria-hidden="true"
              >
                {initials(assignee)}
              </span>
              <span className="font-medium text-ink-700">{assignee}</span>
            </span>
          ) : (
            <span className="chip bg-white/60 text-ink-300">Unassigned</span>
          )}

          {task.dueDate && (
            <span
              className={`chip ${
                late ? 'bg-prio-high/10 text-prio-high border border-prio-high/30' : 'bg-white/60 text-ink-500 border border-white/60'
              }`}
            >
              {late ? 'Overdue · ' : 'Due '}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Quick status change — same backend endpoint drag-drop use karta hai */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {STATUSES.filter(s => s.key !== task.status).map(s => (
            <button
              key={s.key}
              type="button"
              disabled={pending}
              onClick={() => onQuickMove(task._id, s.key)}
              className="btn-chip border text-ink-500"
              style={{ borderColor: `${s.accent}55` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${s.soft}` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

/* --------------------------------------------------------------- column */

function Column({ status, tasks, onQuickMove, pending }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.key, data: { type: 'column', status: status.key } })

  return (
    <section className="glass flex flex-col rounded-2xl">
      {/* coloured header bar — each column has its own identity */}
      <div
        className="flex items-center justify-between gap-2 rounded-t-2xl px-4 py-3"
        style={{
          backgroundImage: `linear-gradient(110deg, ${status.soft}, rgba(255,255,255,0.55))`,
          borderBottom: `1px solid ${status.accent}33`,
        }}
      >
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-900">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundImage: `linear-gradient(135deg, ${status.accent}, ${status.accent}88)` }}
            aria-hidden="true"
          />
          {status.label}
        </h3>
        <span
          className="chip tnum"
          style={{ color: status.text, background: 'rgba(255,255,255,0.75)', border: `1px solid ${status.accent}44` }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-2xl p-3 transition-all duration-200 ${
          isOver ? 'ring-2 ring-inset' : ''
        }`}
        style={{ minHeight: 180, ['--tw-ring-color']: `${status.accent}55` }}
      >
        <SortableContext
          items={tasks.map(t => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-2.5">
            {tasks.map(t => (
              <TaskCard key={t._id} task={t} onQuickMove={onQuickMove} pending={pending} />
            ))}
          </div>
        </SortableContext>

        {!tasks.length && (
          <p
            className="grid place-items-center rounded-xl border border-dashed py-8 text-center text-xs font-medium"
            style={{ color: status.text, borderColor: `${status.accent}44`, background: `${status.soft}55` }}
          >
            {isOver ? 'Drop it here' : 'No tasks in this column'}
          </p>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ page */

export default function ProjectDetails() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingMove, setPendingMove] = useState('')
  const [openForm, setOpenForm] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' })

  // silent=true → background refresh, screen pe skeleton flash na aaye
  const load = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setLoading(true)
      try {
        const [p, t] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks/project/${id}`),
        ])
        setProject(p.data.data.project)
        setTasks(t.data.data || [])
        setErr('')
      } catch (e) {
        setErr(e.response?.data?.msg || 'We could not load this project. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => { load() }, [load])

  const createTask = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks', {
        projectId: id,
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      })
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not create that task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Quick status buttons — top of destination column
  const move = async (taskId, status) => {
    setPendingMove(taskId)
    try {
      await api.patch(`/tasks/${taskId}/move`, { status, position: 0 })
      await load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not move that task. Please try again.')
      load({ silent: true })
    } finally {
      setPendingMove('')
    }
  }

  const removeMember = async (userId) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not remove that member. Please try again.')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /* ---- drag & drop: cross-column ke dauraan hi optimistic move ---- */
  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragOver = ({ active, over }) => {
    if (!over) return
    const draggedId = active.id

    // Functional update — dragOver ek render cycle mekai baar fire hota hai,
    // isliye latest `tasks` se hi status decide karna zaroori hai
    setTasks(prev => {
      const dragged = prev.find(t => t._id === draggedId)
      if (!dragged) return prev

      const destStatus = isColumn(over.id)
        ? String(over.id)
        : prev.find(t => t._id === over.id)?.status

      if (!destStatus || destStatus === dragged.status) return prev

      return prev.map(t => (t._id === draggedId ? { ...t, status: destStatus } : t))
    })
  }

  // Drag ke dauraan `tasks` ka latest snapshot chahiye — closure ke bajaye ref padho
  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return

    const taskId = active.id
    const live = tasksRef.current
    const destStatus = isColumn(over.id)
      ? String(over.id)
      : live.find(t => t._id === over.id)?.status
    if (!destStatus) return

    // handleDragOver ne task ko already destination column me daal diya hai,
    // isliye position usi (fresh) column ki ordering se nikalti hai
    const column = live.filter(t => t.status === destStatus)

    // Card pe drop → us card ki index; column body pe drop → end me jao
    let position = column.findIndex(t => t._id === over.id)
    if (position === -1) position = column.length
    position = Math.max(0, Math.min(position, Math.max(0, column.length - 1)))

    setPendingMove(taskId)
    try {
      const res = await api.patch(`/tasks/${taskId}/move`, { status: destStatus, position })
      const serverTask = res.data?.data
      // Server ka response reconcile karo, phir poora board quietly refresh
      if (serverTask?._id) {
        setTasks(prev =>
          prev.map(t => (t._id === taskId ? { ...t, status: destStatus, position } : t)),
        )
      }
      await load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not move that task. Please try again.')
      await load({ silent: true })
    } finally {
      setPendingMove('')
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    load({ silent: true })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-9">
        <div className="skeleton h-5 w-32" />
        <div className="mt-4 skeleton h-10 w-72" />
        <div className="mt-4 skeleton h-16 w-full max-w-md" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map(c => (
            <div key={c} className="skeleton h-80" />
          ))}
        </div>
      </div>
    )
  }

  if (err && !project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-9">
        <p className="alert-rose rounded-xl px-4 py-3 text-sm font-medium animate-scale-in">{err}</p>
        <Link
          to="/projects"
          className="btn-outline mt-5 inline-block rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          ← Back to projects
        </Link>
      </div>
    )
  }

  const role = myRole(project, user?._id)
  const rolePill = roleMeta(role)
  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null
  const members = project?.members || []

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto max-w-7xl px-4 py-9">
        <Link
          to="/projects"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-ink-500 transition hover:text-brand-600"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span> Projects
        </Link>

        <header className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3 animate-fade-up">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold tracking-tight gradient-text sm:text-4xl">
              {project?.name}
            </h1>
            {project?.description && (
              <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{project.description}</p>
            )}
          </div>
          <span
            className="chip shrink-0 px-2.5 py-1"
            style={{ color: rolePill.text, background: rolePill.bg, border: `1px solid ${rolePill.border}` }}
          >
            {rolePill.label}
          </span>
        </header>

        {err && (
          <p
            role="alert"
            aria-live="polite"
            className="alert-rose mb-5 rounded-xl px-4 py-3 text-sm font-medium animate-scale-in"
          >
            {err}
          </p>
        )}

        {/* Members */}
        <section className="mb-8">
          <h2 className="mb-2.5 font-display text-lg font-bold text-ink-900">
            Members
            <span className="ml-2 text-sm font-semibold tnum text-ink-300">{members.length}</span>
          </h2>

          {/* Sirf Owner hi member add kar sakta hai — backend bhi yehi enforce karta hai */}
          {role === 'OWNER' && (
            <AddMember
              projectId={id}
              members={members}
              onAdded={() => load({ silent: true })}
            />
          )}

          <div className="glass grid gap-2 rounded-2xl p-2 sm:grid-cols-2">
            {members.map(m => {
              const r = roleMeta(m.role)
              const uid = memberId(m)
              return (
                <div
                  key={uid}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-3 py-2.5 transition-colors duration-200 hover:bg-white/85"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundImage: avatarGradient(m.userId?.name || uid) }}
                      aria-hidden="true"
                    >
                      {initials(m.userId?.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {m.userId?.name || 'Unknown member'}
                      </span>
                      <span className="block truncate text-xs text-ink-500">{m.userId?.email}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="chip"
                      style={{ color: r.text, background: r.bg, border: `1px solid ${r.border}` }}
                    >
                      {r.label}
                    </span>
                    {role === 'OWNER' && m.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => removeMember(uid)}
                        className="btn-chip border border-prio-high/30 text-prio-high hover:bg-alert-soft"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* New task form */}
        <section className="glass mb-7 rounded-2xl p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setOpenForm(o => !o)}
            aria-expanded={openForm}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}
                aria-hidden="true"
              >
                +
              </span>
              <span className="font-display text-base font-bold text-ink-900">New task</span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {openForm ? 'Hide' : 'Show'}
            </span>
          </button>

          {openForm && (
            <form onSubmit={createTask} className="mt-4 grid gap-3.5 animate-fade-up">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Title</span>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                  className="field"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Description <span className="normal-case tracking-normal text-ink-300">(optional)</span>
                </span>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Add a little more context"
                  rows={2}
                  className="field resize-y"
                />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Priority</span>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="field"
                  >
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <option key={p} value={p}>
                        {priorityMeta(p).label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Due date</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Assignee</span>
                  <select
                    value={form.assigneeId}
                    onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                    className="field"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={memberId(m)} value={memberId(m)}>
                        {m.userId?.name || 'Unknown member'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-gradient justify-self-start rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                {saving ? 'Adding…' : 'Add task'}
              </button>
            </form>
          )}
        </section>

        {/* Kanban board */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-ink-900">Board</h2>
            <p className="hidden text-xs font-medium text-ink-500 sm:block">
              Drag a card between columns — or use the chips on the card.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {STATUSES.map(col => (
              <Column
                key={col.key}
                status={col}
                tasks={tasks
                  .filter(t => t.status === col.key)
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))}
                onQuickMove={move}
                pending={Boolean(pendingMove)}
              />
            ))}
          </div>

          {!tasks.length && (
            <div className="mt-5">
              <EmptyState
                icon="✦"
                title="This board is empty"
                body="Add your first task above, then drag cards across To Do, In Progress and Done as the work moves."
              />
            </div>
          )}
        </section>
      </div>

      {/* Lifted, slightly rotated copy of the card being dragged */}
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeTask ? (
          <div className="w-[320px] max-w-full">
            <TaskCardBody task={activeTask} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
