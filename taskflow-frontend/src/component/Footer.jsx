const tech = [
  { href: 'https://expressjs.com', label: 'Backend: Express', accent: '#059669' },
  { href: 'https://react.dev', label: 'Frontend: React', accent: '#06B6D4' },
  { href: 'https://www.mongodb.com', label: 'DB: MongoDB', accent: '#10B981' },
]

export default function Footer() {
  return (
    <footer className="relative mt-14 border-t border-white/50 bg-white/55 backdrop-blur-xl">
      {/* gradient hairline instead of a flat border */}
      <div
        className="absolute inset-x-0 -top-px h-px"
        style={{
          backgroundImage:
            'linear-gradient(90deg,rgba(99,102,241,0),rgba(99,102,241,0.6),rgba(217,70,239,0.6),rgba(6,182,212,0.6),rgba(99,102,241,0))',
        }}
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-ink-700">TaskFlow</span> — Project &amp; Task
          Manager
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {tech.map(t => (
            <a
              key={t.href}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1.5 font-medium transition-colors duration-200 hover:text-ink-900"
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-150"
                style={{ backgroundImage: `linear-gradient(135deg,${t.accent},#6366F1)` }}
                aria-hidden="true"
              />
              {t.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
