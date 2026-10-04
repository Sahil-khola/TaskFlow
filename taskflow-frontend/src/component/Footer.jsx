import { Link } from 'react-router-dom'


const internal = [
  { to: '/', label: 'Dashboard', glyph: '◧' },
  { to: '/projects', label: 'Projects', glyph: '▤' },
  { to: '/my-tasks', label: 'My Tasks', glyph: '✓' },
  { to: '/updateProject', label: 'Update project', glyph: '✎' },
]

const external = [
  { href: 'https://react.dev', label: 'React', note: 'UI library' },
  { href: 'https://vite.dev', label: 'Vite', note: 'Build tool' },
  { href: 'https://tailwindcss.com', label: 'Tailwind CSS', note: 'Styling' },
  { href: 'https://expressjs.com', label: 'Express', note: 'API server' },
  { href: 'https://www.mongodb.com', label: 'MongoDB', note: 'Database' },
]

export default function Footer() {
  return (
    <footer className="mt-auto">
      {/* Aurora line — upar wala border page ke gradient se match karta hai */}
      <div
        className="h-px w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg,transparent,#6366F1,#A855F7,#06B6D4,transparent)',
        }}
        aria-hidden="true"
      />

      <div className="glass rounded-none border-x-0 border-b-0">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-11 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2 sm:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg,#6366F1,#D946EF)' }}
                aria-hidden="true"
              >
                TF
              </span>
              <span className="gradient-text">TaskFlow</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
              A collaborative project task manager. Create projects, organise
              work on a Kanban board, and control who can do what with role-based
              access.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip bg-todo-soft text-[#92400E]">JWT · httpOnly cookie</span>
              <span className="chip bg-done-soft text-[#047857]">Role-based access</span>
            </div>
          </div>

          {/* Andar ke pages */}
          <nav aria-labelledby="footer-go">
            <h2
              id="footer-go"
              className="font-display text-xs font-bold uppercase tracking-widest text-ink-500"
            >
              Go to
            </h2>
            <ul className="mt-4 grid gap-1">
              {internal.map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-white/70 hover:text-brand-600"
                  >
                    <span className="w-4 text-center opacity-70" aria-hidden="true">
                      {l.glyph}
                    </span>
                    {l.label}
                    <span
                      className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bahar ke links — naye tab me khulte hain */}
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-ink-500">
              Built with
            </h2>
            <ul className="mt-4 grid gap-1">
              {external.map(l => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-white/70 hover:text-brand-600"
                  >
                    <span className="min-w-0 flex-1 truncate">{l.label}</span>
                    <span className="text-[11px] text-ink-300">{l.note}</span>
                    <span
                      className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-500 sm:flex-row">
            <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
            <p className="tnum">
              React · Express · MongoDB · Vite · Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
