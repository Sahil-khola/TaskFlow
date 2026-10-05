import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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
// import EditProject from '../component/EditProject.jsx'
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

function TaskCard({ task, onQuickMove, pending, canDelete, onEdit, onDelete }) {
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
      canDelete={canDelete}
      onEdit={onEdit}
      onDelete={onDelete}
      handleProps={{
        ...attributes,
        ...listeners,
        ref: setActivatorNodeRef,
      }}
    />
  )
}

function TaskCardBody({
  task,
  innerRef,
  style,
  onQuickMove,
  pending,
  handleProps,
  dragging,
  overlay,
  canDelete,
  onEdit,
  onDelete,
}) {
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

          {/* Drag handle + edit/delete. Overlay me sirf handle — floated card
              pe buttons click karna confuse karta hai. */}
          {!overlay && (
            <div className="-mr-1 -mt-1 flex shrink-0 items-center gap-0.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task._id)}
                  aria-label={`Edit ${task.title}`}
                  className="rounded-lg p-1 text-ink-300 transition hover:bg-white/70 hover:text-brand-600"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M9.5 1.8 12.2 4.5 5.6 11.1l-3.4.7.7-3.4 6.6-6.6Z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              {onDelete && canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(task._id)}
                  aria-label={`Delete ${task.title}`}
                  className="rounded-lg p-1 text-ink-300 transition hover:bg-alert-soft hover:text-prio-high"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 3.8h9M5.5 3.8V2.6h3v1.2M3.6 3.8l.6 7.1a.9.9 0 0 0 .9.8h3.8a.9.9 0 0 0 .9-.8l.6-7.1"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                {...handleProps}
                aria-label={`Drag ${task.title}`}
                className="cursor-grab touch-none rounded-lg p-1 text-ink-300 transition hover:bg-white/70 hover:text-ink-700 active:cursor-grabbing"
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
          )}
          {overlay && (
            <button
              type="button"
              {...handleProps}
              aria-label={`Drag ${task.title}`}
              className="-mr-1 -mt-1 shrink-0 cursor-grab touch-none rounded-lg p-1 text-ink-300"
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
          )}
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

function Column({ status, tasks, onQuickMove, pending, canDeleteFor, onEdit, onDelete }) {
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
              <TaskCard
                key={t._id}
                task={t}
                onQuickMove={onQuickMove}
                pending={pending}
                canDelete={canDeleteFor(t)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
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
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingMove, setPendingMove] = useState('')
  const [removingMember, setRemovingMember] = useState('')
  const [changingRole, setChangingRole] = useState('')
  const [editingId, setEditingId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState('')
  const [deletingTask, setDeletingTask] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  })
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
    setRemovingMember(userId)
    setErr('')
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not remove that member. Please try again.')
    } finally {
      setRemovingMember('')
    }
  }

  const changeRole = async (userId, role) => {
    setChangingRole(userId)
    setErr('')
    try {
      await api.patch(`/projects/${id}/members/${userId}`, { role })
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not change that role. Please try again.')
    } finally {
      setChangingRole('')
    }
  }

  // Delete + confirm — Owner hi kar sakta hai, backend bhi yehi enforce karta hai
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deleteProject = async () => {
    setDeleting(true)
    try {
      await api.delete(`/projects/${id}`)
      navigate('/projects')
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not delete this project. Please try again.')
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
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

  /* ---- task edit / delete ---- */

  // Owner/Admin koi bhi task delete kar sakta hai, Member sirf apna assigned task.
  // Backend yehi rule enforce karta hai — UI bas wahi buttons dikhata hai.
  const canDeleteFor = (task) => {
    if (role === 'OWNER' || role === 'ADMIN') return true
    return Boolean(task.assigneeId) && String(task.assigneeId._id ?? task.assigneeId) === String(user?._id)
  }

  const startEdit = (taskId) => {
    const t = tasks.find(x => x._id === taskId)
    if (!t) return
    setEditingId(taskId)
    setEditForm({
      title: t.title || '',
      description: t.description || '',
      priority: t.priority || 'MEDIUM',
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : '',
      assigneeId: String(t.assigneeId?._id ?? t.assigneeId ?? ''),
    })
    setErr('')
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setSavingEdit(true)
    setErr('')
    try {
      await api.patch(`/tasks/${editingId}`, {
        title: editForm.title.trim(),
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate || null,
        assigneeId: editForm.assigneeId || null,
      })
      cancelEdit()
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not save those changes. Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const askDelete = (taskId) => {
    setErr('')
    setConfirmDeleteId(taskId)
  }

  const doDelete = async () => {
    setDeletingTask(true)
    setErr('')
    try {
      await api.delete(`/tasks/${confirmDeleteId}`)
      setConfirmDeleteId('')
      load({ silent: true })
    } catch (er) {
      setErr(er.response?.data?.msg || 'We could not delete that task. Please try again.')
    } finally {
      setDeletingTask(false)
    }
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
  // Owner + Admin dono member management kar sakte hain
  const canManageMembers = role === 'OWNER' || role === 'ADMIN'

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

        {/* Vertical stack: title -> description -> role pill + Edit button.
            Pehle controls title ke saath ek hi row me the. */}
        <header className="animate-fade-up mt-2 mb-6">
          <h1 className="gradient-text font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {project?.name}
          </h1>

          {/* Description hamesha render — khaali ho to placeholder.
              Warna khaali description se poora <p> element gayab ho jata tha. */}
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
            {project?.description ? (
              project.description
            ) : (
              <span className="italic text-ink-300">No description added yet</span>
            )}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="chip px-2.5 py-1"
              style={{ color: rolePill.text, background: rolePill.bg, border: `1px solid ${rolePill.border}` }}
            >
              {rolePill.label}
            </span>
            {/* Sirf OWNER project rename/description edit kar sakta hai.
                Backend `updateProject` bhi OWNER ko hi allow karta hai, isliye
                Admin ko link dikhana misleading hota. */}
            {role === 'OWNER' && (
              <Link
                to={`/updateProject/${project._id}`}
                className="btn-chip border border-ink-900/12 px-3.5 py-1.5 text-sm font-semibold text-ink-500 transition hover:border-brand-500/40 hover:text-brand-600"
              >
                Edit project
              </Link>
            )}

            {/* Sirf OWNER. Backend `deleteProject` bhi OWNER ko hi allow karta hai. */}
            {role === 'OWNER' &&
              (confirmingDelete ? (
                <span className="animate-scale-in flex flex-wrap items-center gap-2 rounded-xl border border-alert/30 bg-alert-soft/60 px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-[#9F1239]">
                    Delete this project and all its tasks?
                  </span>
                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={deleting}
                    className="rounded-lg bg-alert px-2.5 py-1 text-xs font-bold text-white transition hover:bg-prio-high disabled:opacity-60"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="rounded-lg border border-ink-900/12 px-2.5 py-1 text-xs font-semibold text-ink-500 transition hover:border-ink-900/30 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="btn-chip border border-alert/35 px-3.5 py-1.5 text-sm font-semibold text-[#9F1239] transition hover:bg-alert hover:text-white"
                >
                  Delete project
                </button>
              ))}
          </div>
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

          {/* Owner aur Admin dono member add kar sakte hain — backend yehi enforce karta hai */}
          {(role === 'OWNER' || role === 'ADMIN') && (
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
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-white/60 px-3 py-2.5 transition-colors duration-200 hover:bg-white/85 sm:flex-nowrap"
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
                  <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
                    <span
                      className="chip"
                      style={{ color: r.text, background: r.bg, border: `1px solid ${r.border}` }}
                    >
                      {r.label}
                    </span>

                    {/* Role change + remove dono Owner/Admin ke liye.
                        Owner ki row kabhi editable nahi — backend bhi OWNER
                        ka role change ya remove reject kar deta hai. */}
                    {canManageMembers && m.role !== 'OWNER' && (
                      <select
                        value={m.role}
                        disabled={changingRole === uid}
                        aria-label={`Role for ${m.userId?.name || 'member'}`}
                        onChange={e => changeRole(uid, e.target.value)}
                        className="rounded-lg border border-ink-900/12 bg-white/70 px-2 py-1 text-xs font-semibold text-ink-700 transition hover:border-brand-500/40 focus:border-brand-500 focus:outline-none disabled:opacity-60"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    )}

                    {canManageMembers && m.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => removeMember(uid)}
                        disabled={removingMember === uid}
                        className="btn-chip border border-prio-high/30 text-prio-high hover:bg-alert-soft disabled:opacity-60"
                      >
                        {removingMember === uid ? 'Removing...' : 'Remove'}
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
                canDeleteFor={canDeleteFor}
                onEdit={startEdit}
                onDelete={askDelete}
              />
            ))}
          </div>

          {/* Edit form — card ke neeche slide hota hai, popup nahi */}
          {editingId && (
            <form
              onSubmit={saveEdit}
              className="glass-strong animate-fade-up mt-5 grid gap-3.5 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-base font-bold text-ink-900">Edit task</h3>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-chip border border-ink-900/12 px-3 py-1.5 text-xs font-semibold text-ink-500"
                >
                  Cancel
                </button>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Title</span>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="field"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Description <span className="normal-case tracking-normal text-ink-300">(optional)</span>
                </span>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="field resize-y"
                />
              </label>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Priority</span>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
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
                    value={editForm.dueDate}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Assignee</span>
                  <select
                    value={editForm.assigneeId}
                    onChange={e => setEditForm({ ...editForm, assigneeId: e.target.value })}
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
                disabled={savingEdit}
                className="btn-gradient justify-self-start rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}

          {/* Delete confirm — inline strip, taaki confirm ka option dikhe */}
          {confirmDeleteId && (
            <div className="animate-scale-in mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-alert/30 bg-alert-soft/60 px-3 py-2.5">
              <span className="text-xs font-semibold text-[#9F1239]">
                Delete this task? This cannot be undone.
              </span>
              <button
                type="button"
                onClick={doDelete}
                disabled={deletingTask}
                className="rounded-lg bg-alert px-3 py-1.5 text-xs font-bold text-white transition hover:bg-prio-high disabled:opacity-60"
              >
                {deletingTask ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId('')}
                disabled={deletingTask}
                className="rounded-lg border border-ink-900/12 px-3 py-1.5 text-xs font-semibold text-ink-500 transition hover:border-ink-900/30 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}

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
