
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
    <footer className="bg-white border-t mt-auto">
      {/* Gradient line */}
      <div
        className="h-px w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg,transparent,#6366F1,#A855F7,#06B6D4,transparent)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-2 sm:col-span-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundImage: 'linear-gradient(135deg,#6366F1,#D946EF)' }}
              aria-hidden="true"
            >
              TF
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              TaskFlow
            </span>
          </Link>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
            Developed by <strong>CloudZent Technology Services</strong> — a Gurugram‑based
            software company delivering enterprise mobility and digital transformation
            solutions globally.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
           
            <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-600">
              CloudZent · Gurugram
            </span>
          </div>
        </div>

        {/* Internal Links */}
        <nav aria-labelledby="footer-go">
          <h2
            id="footer-go"
            className="text-xs font-bold uppercase tracking-widest text-gray-400"
          >
            Go to
          </h2>
          <ul className="mt-4 space-y-2">
            {internal.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                >
                  <span className="w-4 text-center opacity-70">{l.glyph}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* External Links */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Built with
          </h2>
          <ul className="mt-4 space-y-2">
            {external.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                >
                  {l.label}
                  <span className="text-xs text-gray-400">{l.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t mt-6 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} TaskFlow · Powered by CloudZent Technology Services · All rights reserved
      </div>
    </footer>
  )
}
