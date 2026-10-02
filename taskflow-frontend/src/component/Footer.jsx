// Glass footer — matches the aurora design system in src/index.css.
// Note: lucide-react v1 dropped all brand icons (Facebook/Twitter/Linkedin),
// so only generic icons from the library are used here.
import { Rocket, Server, Atom, Database, LayoutDashboard, FolderKanban, ListTodo } from 'lucide-react'

const STACK = [
  { href: 'https://react.dev', label: 'React', Icon: Atom },
  { href: 'https://expressjs.com', label: 'Express', Icon: Server },
  { href: 'https://www.mongodb.com', label: 'MongoDB', Icon: Database },
]

const PAGES = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: FolderKanban },
  { to: '/my-tasks', label: 'My Tasks', Icon: ListTodo },
]

export default function Footer() {
  return (
    <footer className="glass mt-10 border-t border-white/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.9)]"
                style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}
              >
                <Rocket size={17} aria-hidden="true" />
              </span>
              <span className="gradient-text font-display text-lg font-extrabold tracking-tight">
                TaskFlow
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              Project boards, tasks and team members in one place. Plan it, track it, ship it.
            </p>
          </div>

          {/* Pages — sirf wahi routes jo actually exist karte hain */}
          <nav aria-label="Footer">
            <h2 className="font-display text-sm font-bold text-ink-900">Go to</h2>
            <ul className="mt-3 grid gap-2">
              {PAGES.map(({ to, label, Icon }) => (
                <li key={to}>
                  <a
                    href={to}
                    className="group inline-flex items-center gap-2 text-sm text-ink-500 transition hover:text-brand-500"
                  >
                    <Icon size={15} className="text-ink-300 transition group-hover:text-brand-500" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Built with */}
          <div>
            <h2 className="font-display text-sm font-bold text-ink-900">Built with</h2>
            <ul className="mt-3 grid gap-2">
              {STACK.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-ink-500 transition hover:text-brand-500"
                  >
                    <Icon size={15} className="text-ink-300 transition group-hover:text-brand-500" aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-white/50 px-4 py-4">
        <p className="text-center text-xs text-ink-500">
          © {new Date().getFullYear()} TaskFlow — Project &amp; Task Manager
        </p>
      </div>
    </footer>
  )
}
