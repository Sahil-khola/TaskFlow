// Shared visual lookups + small helpers.
// Colour constants mirror the tokens declared in src/index.css (@theme block).

export const STATUSES = [
  {
    key: 'TODO',
    label: 'To Do',
    accent: '#F59E0B',
    soft: '#FEF3C7',
    text: '#B45309',
    pill: 'bg-todo-soft text-[#92400E]',
    dot: 'bg-todo',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    accent: '#0891B2',
    soft: '#CFFAFE',
    text: '#0E7490',
    pill: 'bg-doing-soft text-[#0E7490]',
    dot: 'bg-doing',
  },
  {
    key: 'DONE',
    label: 'Done',
    accent: '#059669',
    soft: '#D1FAE5',
    text: '#047857',
    pill: 'bg-done-soft text-[#047857]',
    dot: 'bg-done',
  },
]

export const statusMeta = (key) => STATUSES.find(s => s.key === key) || STATUSES[0]

export const PRIORITIES = {
  HIGH: {
    label: 'High',
    text: '#BE123C',
    bg: 'rgba(225,29,72,0.10)',
    border: 'rgba(225,29,72,0.30)',
    bar: '#E11D48',
  },
  MEDIUM: {
    label: 'Medium',
    text: '#B45309',
    bg: 'rgba(217,119,6,0.10)',
    border: 'rgba(217,119,6,0.30)',
    bar: '#D97706',
  },
  LOW: {
    label: 'Low',
    text: '#475569',
    bg: 'rgba(100,116,139,0.10)',
    border: 'rgba(100,116,139,0.28)',
    bar: '#64748B',
  },
}

export const priorityMeta = (p) => PRIORITIES[p] || PRIORITIES.MEDIUM

// Role pill colours: Owner violet, Admin cyan, Member slate
export const ROLES = {
  OWNER: {
    label: 'Owner',
    text: '#6B21A8',
    bg: 'rgba(168,85,247,0.14)',
    border: 'rgba(168,85,247,0.35)',
  },
  ADMIN: {
    label: 'Admin',
    text: '#0E7490',
    bg: 'rgba(8,145,178,0.14)',
    border: 'rgba(8,145,178,0.32)',
  },
  MEMBER: {
    label: 'Member',
    text: '#334155',
    bg: 'rgba(100,116,139,0.14)',
    border: 'rgba(100,116,139,0.30)',
  },
}

export const roleMeta = (r) => ROLES[r] || ROLES.MEMBER

export const isOverdue = (t) =>
  Boolean(t.dueDate) && new Date(t.dueDate) < new Date() && t.status !== 'DONE'

export const myRole = (project, userId) =>
  project?.members?.find(m => String(m.userId?._id ?? m.userId) === String(userId))?.role

// Member id kabhi populate hota hai kabhi raw ObjectId — dono handle karo
export const memberId = (m) => m.userId?._id ?? m.userId

// Deterministic gradient per person so avatars stay stable between renders
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366F1,#A855F7)',
  'linear-gradient(135deg,#06B6D4,#3B82F6)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#10B981,#06B6D4)',
  'linear-gradient(135deg,#EC4899,#8B5CF6)',
  'linear-gradient(135deg,#F43F5E,#FB923C)',
  'linear-gradient(135deg,#14B8A6,#6366F1)',
]

export const avatarGradient = (seed = '') => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

export const initials = (name = '?') => (name || '?').trim().charAt(0).toUpperCase() || '?'

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
