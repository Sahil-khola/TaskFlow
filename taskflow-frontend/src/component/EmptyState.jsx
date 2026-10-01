// Empty state — gradient icon chip + copy. Reused across pages.

export default function EmptyState({ icon = '✦', title, body, action }) {
  return (
    <div className="glass lift rounded-2xl px-6 py-12 text-center animate-scale-in">
      <div
        className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl text-white shadow-lg"
        style={{
          backgroundImage: 'linear-gradient(135deg,#4F46E5,#A855F7)',
          boxShadow: '0 18px 34px -16px rgba(124,58,237,0.9)',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{title}</h3>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
