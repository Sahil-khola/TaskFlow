# NOTES

Development notes — the decisions behind the code and the gotchas we actually
hit. `README.md` covers what the project *is*; this file covers *why* it ended
up this way and what will bite us later.

---

## Contents

- [Environment and tooling](#environment-and-tooling)
- [Architecture decisions](#architecture-decisions)
- [Bugs we hit and how we fixed them](#bugs-we-hit-and-how-we-fixed-them)
- [Things that will trip us up again](#things-that-will-trip-us-up-again)
- [Open issues](#open-issues)

---

## Environment and tooling

| Tool     | Version | Notes                                    |
| -------- | ------- | ---------------------------------------- |
| Node.js  | 22.17.1 | Backend runs natively, no transpiler     |
| npm      | 9+      | Workspaces **not** used, see below       |
| Vite     | 8.3.2   | Frontend bundler and dev server          |
| React    | 19.2.8  |                                        |
| Tailwind | v4.3.3  | CSS-first config, no `tailwind.config.js` |

### Why there is no npm workspaces setup

The backend and frontend are sibling folders, each with its own
`node_modules`. We considered converting to npm workspaces, but they hoist
dependencies to the repository root, which would have invalidated both existing
installs and touched every lockfile.

Instead the root `package.json` is a thin orchestrator using
`npm --prefix <folder>`:

```json
"dev": "concurrently -k -n backend,frontend -c blue,magenta \"npm:dev:backend\" \"npm:dev:frontend\""
```

`concurrently` is a root-level devDependency only — the two applications stay
fully independent and deployable on their own.

### Tailwind v4 specifics

- No `tailwind.config.js`. The theme lives in an `@theme` block inside
  `src/index.css`, and the Vite plugin is registered in `vite.config.js`.
- Default spacing token is `--spacing: .25rem`, so `inset-0.75` compiles to
  exactly 3px. Prefer canonical steps (`inset-0.75`) over arbitrary values
  (`inset-[3px]`) — the build warns about the latter.

---

## Architecture decisions

### Auth lives in an httpOnly cookie, not localStorage

The login response sets `token` as an httpOnly cookie. JavaScript cannot read
it, so an XSS bug cannot exfiltrate the session. Nothing is ever written to
`localStorage` or `sessionStorage`.

Two details matter:

- The Axios instance needs `withCredentials: true` or the browser silently drops
  the cookie on cross-origin dev requests.
- `sameSite: 'lax'` is set explicitly. It is the browser default, but stating
  it documents the intent and guards against a future default change.

The auth middleware in `src/middleware/auth.js` still reads
`Authorization: Bearer` as a fallback, specifically so Postman and `curl` are
usable. The browser never uses that path.

### Role guards live on the server

The frontend hides buttons a user cannot use, but that is only a convenience.
Every permission is re-checked in the controller. The frontend guards were
written to mirror `isManager()` and the Owner-only checks exactly — if one side
changes, the other must follow, or the UI will offer actions the API rejects.

### Task `position` is scoped to a status column

`position` is an integer starting at 0, but it orders tasks **within a single
status**, not across the whole project. This is what makes drag-and-drop
between columns correct: moving a card to the top of In Progress sets
`position: 0` among In Progress tasks only.

A project with 3 To Do and 2 In Progress tasks has positions
`TODO: 0,1,2` and `IN_PROGRESS: 0,1`. Sharing one counter across statuses would
have produced broken ordering the moment a card moved columns.

### Express serves the frontend in production

Rather than deploying two Render services and fighting CORS and cross-site
cookies, `app.js` serves `taskflow-frontend/dist` itself when
`NODE_ENV=production`. One origin, one service, cookies work without any
special flags.

The order in `app.js` is load-bearing:

1. Middleware (helmet, cors, cookie parser, body parsers)
2. API routes
3. `express.static(dist)` + SPA fallback
4. Catch-all 404

**The static block must stay after the API routes.** Registered earlier, its
catch-all returns `index.html` for `/api/*` and the frontend gets HTML where it
expects JSON — which surfaces as confusing parse errors rather than a clear
failure.

### `position` and cache headers

Built assets are hashed by Vite, so they are safe to cache for a year.
`index.html` is sent with `Cache-Control: no-cache`, otherwise browsers pin the
old HTML shell and users keep loading a stale bundle after a deploy.

---

## Bugs we hit and how we fixed them

### React Router: `[Navbar] is not a <Route> component`

**Symptom** — the whole app crashed on load:

```
Uncaught Error: [Navbar] is not a <Route> component.
All component children of <Routes> must be a <Route> or <React.Fragment>
```

**Cause** — `Navbar` and `Footer` were placed directly inside `<Routes>`.

**Fix** — wrap them in a plain component and render that:

```jsx
const Layout = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)
```

Only `<Route>` elements may be direct children of `<Routes>`.

### Port mismatch produced two backend instances

**Symptom** — edits to `app.js` appeared to have no effect, and the frontend was
talking to a stale process.

**Cause** — `.env` had `PORT=5000` while `api.js` pointed at `5001`. Two
backends were running simultaneously: one from `npm run dev` on 5000, and an
orphan from an earlier session on 5001. The browser was hitting the orphan, so
new code never showed up.

**Fix** — aligned `.env` to `PORT=5001` and killed the orphan. Lesson: when
behaviour does not change after an edit, check for duplicate listeners before
assuming the code is wrong.

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5001,5173
Stop-Process -Id <pid> -Force
```

### `concurrently -p` crashed the whole run

**Symptom** — immediate failure:

```
TypeError: prev.replace is not a function
    at concurrently/dist/src/logger.js:121
```

**Cause** — we passed `-p` twice, hoping it worked like `-n`:

```
-p "[backend]" -p "[frontend]"
```

`-p` is a single global prefix *format*, not a per-command label. yargs parsed
the duplicate flags into an array, and the logger tried to call `.replace()` on
it.

**Fix** — `-n` already provides per-command labels. Dropped `-p` entirely:

```
concurrently -k -n backend,frontend -c blue,magenta "npm:dev:backend" "npm:dev:frontend"
```

### A `.env` file that Vite never read

**Symptom** — `taskflow-frontend/src/.env` contained
`VITE_API_URL=http://localhost:5000`, but changing it had no effect.

**Cause** — Vite only reads env files from the project **root** (`envDir`
defaults to the root). A `.env` inside `src/` is ignored entirely.

**Fix** — moved it to `taskflow-frontend/.env.development` and deleted the
file in `src/`. It was also pointing at the wrong port.

### MongoDB Atlas connection failed on Render

**Symptom** — deploy crashed after printing the connection string:

```
Trying to connect with: mongodb+srv://...
==> Exited with status 1
```

Two separate problems were stacked:

1. **No database name.** The URL ended at `/?appName=Cluster0`, so Mongoose
   silently fell back to the `test` database. Confirmed by running the same
   connection locally, which reported `db: test`.
2. **IP allowlist.** The credentials were valid — we proved it by connecting
   from a local machine and reading the seeded data back. Render's outbound IPs
   are dynamic and fall in no fixed range, so they must be allowed explicitly.

**Fix** — added the database name (`/TaskFlow`) and added `0.0.0.0/0` to Atlas
Network Access. The local `.env` had been hiding problem 2 entirely, because
localhost is obviously allowed.

### Env var renamed `MONGO_URL` → `MONGODB_URL`

`src/config/db.js` now reads `process.env.MONGODB_URL`. This was a deliberate
change from an earlier `MONGO_URL`, to match the original assignment scaffold.

Every reference was updated together — `db.js`, `.env`, `.env.example` and the
README. Miss one and the failure mode is confusing: Mongoose reports
`MONGO_URL is not set` rather than falling back.

### Tailwind arbitrary value warning

```
[tailwindcss] The class `inset-[3px]` can be written as `inset-0.75`
```

Changed to `inset-0.75`. Verified byte-identical output in the compiled CSS:

```
--spacing: .25rem
inset: calc(var(--spacing) * .75)   →  3px
```

Purely cosmetic, no rendering change.

### Files reverting after commit

**Symptom** — the running app threw the `<Navbar> is not a <Route>` error even
though the fix had been applied and verified minutes earlier, with a clean
`git status`.

**Cause** — commit `217fe43` ("Add Navbar") had overwritten `App.jsx`,
`Navbar.jsx` and `SignUp.jsx` with older versions, and `ProjectDetails.jsx` had
been saved from a stale editor buffer.

**Lesson** — check `git log --oneline` before assuming an edit was lost. The
work was not missing; it had been reverted by a commit. Files currently open in
an editor can also overwrite newer on-disk content when saved.

---

## Things that will trip us up again

### Render sets `PORT`, and `dotenv` will not override it

`dotenv.config()` does **not** overwrite variables that already exist in
`process.env`. That is good — it is why Render's random `PORT` wins over
whatever is in `.env`.

It also means: if you `export PORT=5001` in your shell before `npm start`, the
`.env` value is silently ignored. This caused the duplicate-instance bug above.

Never set `PORT` in the Render dashboard. It fights the platform and breaks the
health check binding.

### `NODE_ENV=production` changes three things at once

1. `express.static` starts serving `taskflow-frontend/dist`
2. The `token` cookie gets `secure: true`
3. `trust proxy` becomes necessary

Forgetting the build means the API works but every page 404s. Forgetting
`NODE_ENV` in production means the cookie is issued without `secure`, which
browsers reject on HTTPS — login appears to succeed and then immediately fails.

`app.set('trust proxy', 1)` must stay in place for Render. Without it
`req.secure` is always false behind Render's proxy, and secure cookies are not
issued.

### Helmet's default CSP blocks the Vite build

Helmet's default Content-Security-Policy blocks the inline modulepreload
polyfill that Vite injects, which produced a blank page in production only —
dev worked fine.

Resolved by disabling CSP specifically, not Helmet:

```js
helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
})
```

All other Helmet headers stay active. Revisit this if we add a third-party
script and want CSP enforcement.

### Local `.env` and production diverge quietly

The local `.env` points at Atlas with a working IP allowlist, so Atlas-specific
bugs do not reproduce locally. Anything network-related needs testing against
the deployed service.

### Lint warnings are real, not noise

Four `react-hooks/set-state-in-effect` errors remain in `MyTasks.jsx`,
`Projects.jsx` and `ProjectDetails.jsx`. The pattern is:

```jsx
const load = async () => { setLoading(true); ... }
useEffect(load, [])
```

The rule is correct — synchronous `setState` in an effect body causes cascading
renders. These were written to ship working pages and were not revisited.

Also outstanding: `AuthContext.jsx` trips
`react-refresh/only-export-components` because it exports both the context and
the provider. The fix is to move the context object into its own file.

### Passwords must not reach logs

An earlier `db.js` printed the full connection string on startup, which put the
Atlas password into Render's logs. It now prints only the host. Keep it that
way — if you add connection logging, mask the credentials first.

---

## Open issues

- **Lint errors** — 4 `set-state-in-effect` errors plus 1
  `react-refresh` error in `AuthContext.jsx`. Cosmetic, but real.
- **Unused component** — `src/component/EditProject.jsx` is no longer imported
  anywhere after editing moved to the `/updateProject` page. Safe to delete.
- **Password hashing** — passwords are stored as a bcrypt hash, which is
  correct, but there is no hashing pepper and no rate limiting on `/login`.
- **Comment deletion** — comments can be created and read, not deleted.
- **Free-tier limits** — Render's free tier spins down after 15 minutes idle,
  so the first request after a pause can take up to a minute. A paid plan, or a
  periodic ping from an uptime monitor, avoids the cold start.
- **Atlas credentials** — an Atlas password was pasted into chat in plain text
  during the Render debugging session and should be rotated.
