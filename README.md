# TaskFlow

A collaborative project task manager. Organise work into projects, track it on
a Kanban board, and manage who can do what.

**Stack:** React 19 + Vite + Tailwind CSS v4 (frontend) · Express + MongoDB
(Mongoose) (backend) · JWT auth in an httpOnly cookie.

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Running both servers](#running-both-servers)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Frontend routes](#frontend-routes)
- [API reference](#api-reference)
- [Roles and permissions](#roles-and-permissions)
- [Data models](#data-models)
- [Deploying to Render](#deploying-to-render)
- [Troubleshooting](#troubleshooting)

---

## Features

**Authentication**

- Sign up, log in and log out
- Session stored in an httpOnly cookie — never in `localStorage`, so page
  scripts cannot read the token
- Protected routes redirect to `/login` when no valid session exists

**Projects**

- Create a project (the creator automatically becomes its Owner)
- Edit name and description from a dedicated `/updateProject` page
- Invite members by email search
- Remove members, with role-based guards

**Tasks**

- Kanban board with `To Do`, `In Progress` and `Done` columns
- Real drag-and-drop reordering via `@dnd-kit`, persisted to the server
- Priorities: low, medium, high
- Due dates, with overdue tasks highlighted automatically
- Filter by status, priority, assignee, or free-text search
- Comments on any task

**Other**

- Personal "My Tasks" view across every project you belong to
- Dashboard with summary counts and overdue alerts
- Responsive, accessible UI with a consistent design system

---

## How it works

### The big picture

```
Browser ──▶ React SPA ──▶ Axios ──▶ Express API ──▶ Mongoose ──▶ MongoDB
                :5173                   :5001
```

In development the two servers run separately: Vite on `5173`, Express on
`5001`, and the browser talks to both.

In production Render hosts **one** service. Express serves the Vite build
(`taskflow-frontend/dist`) itself, so the SPA and the API share a single
origin. That removes CORS entirely and lets the session cookie work without
any cross-site flags.

### Authentication flow

```
1. POST /api/auth/login  { email, password }
2. Server verifies the bcrypt hash, signs a JWT, and sends it as a cookie
       res.cookie('token', jwt, {
         httpOnly: true,                          // JS cannot read it
         secure:   NODE_ENV === 'production',    // HTTPS only in production
         sameSite: 'lax',
       })
3. Every later request carries that cookie automatically
       (the Axios instance sets withCredentials: true)
4. auth middleware verifies the JWT and sets req.user
5. No token, or an invalid one → 401
6. The Axios interceptor catches that 401 and redirects to /login
```

Nothing is ever written to `localStorage` or `sessionStorage`. The practical
benefit is that an XSS bug cannot exfiltrate the session, because page
JavaScript cannot read an httpOnly cookie.

On page load `AuthContext` calls `GET /api/auth/me` to restore the session from
the cookie. While that check is in flight, `Protected` shows a branded loader
instead of flashing the login page.

> The auth middleware also accepts an `Authorization: Bearer` header as a
> fallback, so Postman and `curl` work. The browser never uses that path.

### Route protection

Every route except `/login` and `/signup` is wrapped in `<Protected>`:

```jsx
if (loading) return <BrandLoader />       // still checking the session
if (!user)   return <Navigate to="/login" replace />
return children
```

`Navbar` and `Footer` live *inside* that guard, so they never render for a
signed-out visitor.

This is a UX convenience only. **Real authorisation lives on the server** —
every controller re-checks membership and role. Hiding a button does not
protect the endpoint.

### Task drag-and-drop

This is the most involved flow in the app.

**While dragging** — `handleDragOver` runs on every pointer move. The moment
the card crosses into another column, local state is updated so the card
visually moves immediately. This is an optimistic update: the UI never waits
for the server. A ref (`tasksRef`) is used to read the latest state, because
`dragOver` fires many times per render cycle and a closure would go stale.

**On drop** — `handleDragEnd` works out the destination column and index, then:

```
PATCH /api/tasks/:id/move  { status, position }
```

**On the server** (`moveTask` in `task.controller.js`):

1. Validate the status is one of `TODO` / `IN_PROGRESS` / `DONE`
2. Validate `position` is a number `>= 0`
3. Check permission — Owner or Admin, or the task's own assignee
4. Set the new status, and stamp `completedAt` when it becomes `DONE`
5. Fetch every sibling in the destination column, sorted by position
6. Remove the moved task, splice it back in at the requested index
7. `bulkWrite` fresh `position: 0, 1, 2…` values onto the whole column

Step 7 is the important one. Renumbering the entire column — rather than
patching only the dragged card — is what keeps the ordering consistent no
matter where the card was dropped.

### Why `position` is scoped to a column

`position` starts at 0, but it orders tasks **within a single status**, not
across the whole project:

```
TaskFlow Website
  TODO         → position 0, 1, 2
  IN_PROGRESS  → position 0, 1
  DONE         → position 0
```

So dropping a card at the top of In Progress sends `position: 0`, and the card
lands correctly among the In Progress tasks. With a single shared counter,
moving a card between columns would scramble the order.

### Adding a member

```
1. Owner types an email (minimum 3 characters)
2. GET /api/auth/users?email=…      ← search, returns at most 10 users
3. Owner picks a result and chooses a role (Member or Admin)
4. POST /api/projects/:id/members   { userId, role }
5. The user is pushed into project.members
```

The search endpoint escapes regex metacharacters before building the query, so
a search like `.*` returns nothing rather than matching every user. It only
ever selects `_id`, `name` and `email` — never password hashes.

The frontend also filters out anyone who is already a member, so the results
list only contains people who can actually be added.

### Project editing

Editing happens on a dedicated `/updateProject` route, not in a modal:

- `/updateProject` lists the user's projects to pick from
- `/updateProject/:id` opens one project directly

Only Owners and Admins see the link, and both are re-checked on the server.
A Member visiting the URL directly sees the form disabled with an explanation.

---

## Tech stack

| Layer       | Choice                                             |
| ----------- | -------------------------------------------------- |
| Frontend    | React 19, React Router 7, Vite 8                   |
| Styling     | Tailwind CSS v4, Plus Jakarta Sans + Inter, Lucide |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`                |
| HTTP        | Axios                                               |
| Backend     | Node.js, Express 4                                  |
| Database    | MongoDB via Mongoose 8                              |
| Auth        | `jsonwebtoken` + `bcrypt`                           |
| Security    | Helmet, CORS, cookie-parser                         |

---

## Prerequisites

- **Node.js 18 or newer** (developed on Node 22)
- **npm 9 or newer**
- **MongoDB** — either a local install or a free MongoDB Atlas cluster

Check your versions:

```bash
node -v
npm -v
```

---

## Quick start

```bash
# 1. Install dependencies for both the backend and the frontend
npm run setup

# 2. Create your environment file
cp .env.example taskflow-backend/.env
#    Windows PowerShell:
#    Copy-Item .env.example taskflow-backend/.env

# 3. Seed demo data (optional but recommended)
npm run seed

# 4. Start both servers
npm run dev
```

Open <http://localhost:5173> and log in with any of the demo accounts below.

> Running `npm run seed` is destructive — it deletes every user, project, task
> and comment in the database first.

---

## Environment variables

The backend reads `taskflow-backend/.env`.

| Variable       | Required | Example                                              | Notes                                             |
| -------------- | -------- | ---------------------------------------------------- | ------------------------------------------------- |
| `MONGODB_URL`  | Yes      | `mongodb://localhost:27017/taskflow`                | Connection string. See the Atlas note below.      |
| `JWT_SECRET`   | Yes      | `a_long_random_string`                              | Signs session tokens.                             |
| `PORT`         | No       | `5001`                                               | Local only. Do **not** set this on Render.        |
| `FRONTEND_URL` | No       | `http://localhost:5173`                             | Local only. Leave blank in production.            |
| `NODE_ENV`     | No       | `production`                                        | Set this on Render.                              |

### MongoDB Atlas notes

If you use Atlas, two things are easy to get wrong:

1. **Include the database name.** A URL ending in `/` with no database name
   makes Mongoose silently fall back to the `test` database:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/taskflow
   ```

2. **Allow Render's IPs.** Render's outbound IPs are dynamic and do not fall
   inside any fixed range, so add `0.0.0.0/0` under **Network Access**. Without
   this the connection hangs and the service exits with status 1.

Also grant your Atlas database user read/write access on the target database
under **Database Access**.

### Why `PORT` and `FRONTEND_URL` are local-only

- **PORT** — Render assigns its own port. Setting it yourself causes a port
  mismatch, because `dotenv` never overrides a variable that already exists in
  the environment.
- **FRONTEND_URL** — In production the API and the SPA are served from the same
  origin, so CORS is not needed. Setting it to a mismatched origin breaks
  requests instead of enabling them.

---

## Running both servers

All commands are run from the repository root.

| Command            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `npm run setup`    | Installs dependencies in both workspaces            |
| `npm run dev`      | Runs backend and frontend together                 |
| `npm run dev:backend`  | Runs only the API on port 5001                  |
| `npm run dev:frontend` | Runs only the Vite dev server on port 5173      |
| `npm run seed`     | Wipes and reseeds the database                     |
| `npm run build`    | Production build of the frontend                   |
| `npm run lint`     | ESLint over the frontend                           |
| `npm start`        | Production-style backend (serves the built SPA)    |

`npm run dev` uses [`concurrently`](https://www.npmjs.com/package/concurrently)
to run both processes in one terminal with coloured `[backend]` and
`[frontend]` prefixes. Pressing `Ctrl+C` stops both.

| Service  | URL                             |
| -------- | ------------------------------- |
| Frontend | <http://localhost:5173>         |
| Backend  | <http://localhost:5001>         |
| Health   | <http://localhost:5001/health>  |

The frontend reads its API base URL from `taskflow-frontend/.env.development`:

```
VITE_API_URL=http://localhost:5001/api
```

In a production build this file is ignored and the app falls back to the
relative path `/api`, which is correct because both are served from one origin.

---

## Demo accounts

After `npm run seed`, all three accounts use the password **`password123`**.

| Email                | Role           |
| -------------------- | -------------- |
| `owner@gmail.com`    | Owner          |
| `admin@gmail.com`    | Admin          |
| `member@gmail.com`   | Member         |

The seed creates **3 users, 3 projects, 12 tasks and 2 comments**, including
2 overdue tasks.

Membership differs per project so permissions are visible immediately:

| Project              | Owner  | Admin  | Member |
| -------------------- | ------ | ------ | ------ |
| TaskFlow Website     | Owner  | Admin  | Member |
| Mobile App Redesign  | Owner  | Admin  | —      |
| Internal Tools       | Admin  | —      | Member |

Sign in as `member@gmail.com` and open **Mobile App Redesign** to see the
"you are not a member of this project" guard, and **TaskFlow Website** to see a
Member's read-only project view.

---

## Project structure

```
taskflow/
├── package.json              # root orchestrator (concurrently)
├── package-lock.json
├── .env.example              # documented environment template
├── .gitignore
├── README.md
│
├── taskflow-backend/
│   ├── app.js                # Express app, static serving, startup
│   ├── seed.js               # demo data generator
│   ├── .env                  # local secrets (git-ignored)
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   └── db.js         # Mongoose connection
│       ├── models/
│       │   ├── User.js
│       │   ├── Project.js
│       │   ├── Task.js
│       │   └── Comment.js
│       ├── middleware/
│       │   └── auth.js       # JWT verification
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── project.controller.js
│       │   └── task.controller.js
│       └── routes/
│           ├── auth.routes.js
│           ├── project.routes.js
│           └── task.routes.js
│
└── taskflow-frontend/
    ├── index.html
    ├── vite.config.js
    ├── .env.development      # dev-only API URL
    └── src/
        ├── main.jsx
        ├── App.jsx           # all routes
        ├── index.css         # Tailwind theme and design tokens
        ├── api/
        │   └── api.js        # Axios instance and 401 interceptor
        ├── context/
        │   └── AuthContext.jsx
        ├── component/
        │   ├── Protected.jsx     # route guard + branded loader
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── AddMember.jsx
        │   ├── EditProject.jsx
        │   ├── EmptyState.jsx
        │   └── lookups.js        # shared status/priority/role metadata
        └── pages/
            ├── Login.jsx
            ├── SignUp.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            ├── ProjectDetails.jsx
            ├── UpdateProject.jsx
            └── MyTasks.jsx
```

---

## Frontend routes

| Path                  | Page           | Access    |
| --------------------- | -------------- | --------- |
| `/login`              | Login          | Public    |
| `/signup`             | Sign up        | Public    |
| `/`                   | Dashboard      | Protected |
| `/projects`           | Project list   | Protected |
| `/projects/:id`       | Kanban board   | Protected |
| `/updateProject`      | Pick a project | Protected |
| `/updateProject/:id`  | Edit project   | Protected |
| `/my-tasks`           | Personal tasks | Protected |
| `*`                   | Redirects to `/` | —       |

Everything except `/login` and `/signup` is wrapped in `<Protected>`, which
shows a loading state while the session is checked and redirects to `/login`
when there is no valid user. `Navbar` and `Footer` live inside that guard, so
they never render for signed-out visitors.

---

## API reference

Base URL: `http://localhost:5001/api` in development, `/api` in production.

All endpoints below require authentication unless stated otherwise.

### Auth — `/api/auth`

| Method   | Endpoint        | Access  | Description                          |
| -------- | --------------- | ------- | ------------------------------------ |
| `POST`   | `/signup`       | Public  | Create an account                    |
| `POST`   | `/login`        | Public  | Log in, sets the `token` cookie      |
| `POST`   | `/logout`       | Public  | Clear the cookie                     |
| `GET`    | `/me`           | Private | Current user                         |
| `GET`    | `/users?email=` | Private | Search users by email for invitations |

`GET /users` requires at least 3 characters, matches case-insensitively,
escapes regex metacharacters and returns at most 10 results containing only
`_id`, `name` and `email`.

### Projects — `/api/projects`

| Method   | Endpoint                       | Access   | Description                    |
| -------- | ------------------------------ | -------- | ------------------------------ |
| `POST`   | `/`                            | Private  | Create a project               |
| `GET`    | `/`                            | Private  | Projects you belong to         |
| `GET`    | `/:id`                         | Private  | One project                    |
| `PATCH`  | `/:id`                         | Manager  | Update name and description    |
| `POST`   | `/:id/members`                 | Owner    | Add a member                   |
| `DELETE` | `/:id/members/:userId`         | Owner    | Remove a member                |

`Manager` means Owner or Admin.

### Tasks — `/api/tasks`

| Method | Endpoint                 | Access  | Description                          |
| ------ | ------------------------ | ------- | ------------------------------------ |
| `GET`  | `/my`                    | Private | Tasks assigned to you                |
| `POST` | `/`                      | Private | Create a task                        |
| `GET`  | `/project/:projectId`    | Private | Tasks in a project, with filters     |
| `PATCH`| `/:id/move`              | Varies  | Change status and position           |
| `POST` | `/:id/comments`          | Private | Add a comment                        |
| `GET`  | `/:id/comments`          | Private | Comments on a task                   |

`GET /project/:projectId` accepts `status`, `priority`, `assigneeId` (use
`unassigned` for unassigned tasks) and `search`.

Moving a task requires either the Owner or Admin role, or being the task's
assignee.

### Health — outside `/api`

| Method | Endpoint   | Description                     |
| ------ | ---------- | ------------------------------- |
| `GET`  | `/health`  | Liveness probe used by Render   |

```json
{ "status": "ok", "message": "Server is healthy" }
```

### Using the API from Postman or curl

The browser sends the session as a cookie, which `curl` does not do by
default. The auth middleware also accepts a bearer token, so send it manually:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@gmail.com","password":"password123"}'

# Take the token from the response, then:
curl http://localhost:5001/api/projects \
  -H "Authorization: Bearer <token>"
```

---

## Roles and permissions

| Action                       | Member | Admin | Owner |
| ---------------------------- | ------ | ----- | ----- |
| View a project               | Yes    | Yes   | Yes   |
| Create a task                | Yes    | Yes   | Yes   |
| Comment on a task            | Yes    | Yes   | Yes   |
| Move your own task           | Yes    | Yes   | Yes   |
| Move someone else's task     | No     | Yes   | Yes   |
| Edit project details         | No     | Yes   | Yes   |
| Delete a project             | No     | No    | Yes   |
| Add or remove members        | No     | No    | Yes   |

These rules are enforced on the server. The frontend hides controls a user
cannot use, but the API rejects the request regardless — never trust the UI for
authorisation.

Roles are stored per project, so the same person can be an Owner in one project
and a Member in another.

---

## Data models

### User

| Field      | Type   | Notes                     |
| ---------- | ------ | ------------------------- |
| `name`     | String |                           |
| `email`    | String | Unique                    |
| `password` | String | bcrypt hash, never returned |
| `createdAt` / `updatedAt` | Date | Automatic |

### Project

| Field         | Type     | Notes                          |
| ------------- | -------- | ------------------------------ |
| `name`        | String   |                                |
| `description` | String   |                                |
| `ownerId`     | ObjectId | Ref to `User`                   |
| `members`     | Array    | `{ userId, role }` per entry    |
| `createdAt` / `updatedAt` | Date | Automatic                   |

`role` is one of `OWNER`, `ADMIN` or `MEMBER`.

### Task

| Field         | Type     | Notes                                        |
| ------------- | -------- | -------------------------------------------- |
| `projectId`   | ObjectId | Ref to `Project`                             |
| `title`       | String   | Required                                     |
| `description` | String   |                                              |
| `status`      | String   | `TODO`, `IN_PROGRESS` or `DONE`              |
| `priority`    | String   | `LOW`, `MEDIUM` or `HIGH`                    |
| `position`    | Number   | Order **within** its status column, from 0   |
| `creatorId`   | ObjectId | Ref to `User`                                 |
| `assigneeId`  | ObjectId | Ref to `User`, optional                      |
| `dueDate`     | Date     | Optional; drives the overdue flag            |

`position` is scoped to a status column rather than the whole project, which is
what makes drag-and-drop between columns work correctly.

### Comment

| Field      | Type     | Notes         |
| ---------- | -------- | ------------- |
| `taskId`   | ObjectId | Ref to `Task` |
| `authorId` | ObjectId | Ref to `User` |
| `body`     | String   |               |

---

## Deploying to Render

The backend serves the built frontend, so Render only needs **one** web service.

### 1. Push to GitHub

The repository root — the folder containing `package.json`,
`taskflow-backend/` and `taskflow-frontend/` — is what you connect. Render has
no way to deploy a parent folder.

### 2. Create the service

| Field                 | Value                                                       |
| --------------------- | ----------------------------------------------------------- |
| **Root Directory**    | *(leave blank)*                                             |
| **Runtime**           | Node                                                        |
| **Build Command**     | `npm install && npm --prefix taskflow-backend install && npm --prefix taskflow-frontend install && npm run build` |
| **Start Command**     | `npm start`                                                 |
| **Health Check Path** | `/health`                                                   |

> **Root Directory must stay blank.** Backend and frontend are sibling folders,
> and the build command uses `npm --prefix` relative to the repository root.
> Pointing it at `taskflow-backend` would hide the frontend entirely.

### 3. Environment variables

| Key           | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `NODE_ENV`    | `production`                                             |
| `MONGODB_URL` | Your Atlas connection string, database name included     |
| `JWT_SECRET`  | A long random string                                     |

Do **not** set `PORT` or `FRONTEND_URL` — see
[Environment variables](#environment-variables) for why.

### 4. Allow Render's IPs in Atlas

Under **Network Access**, add `0.0.0.0/0`. Render's outbound IPs are dynamic,
so there is nothing narrower to allow.

### 5. Seed the production database

Optional. Run this once from a machine that can reach the cluster:

```bash
cd taskflow-backend
$env:MONGODB_URL="mongodb+srv://..."   # or export MONGODB_URL=...
node seed.js
```

You can also run it as a one-off job from Render's **Shell** tab.

### How it fits together

In production, `NODE_ENV=production` makes Express serve
`taskflow-frontend/dist` itself and fall back to `index.html` for unmatched
routes so deep links like `/projects/:id` survive a refresh. The static block is
registered **after** the API routes, so `/api/*` is never swallowed by the SPA
fallback. Because everything is one origin, cookies are same-site and CORS is
not required.

---

## Troubleshooting

**Backend exits with status 1 right after "Trying to connect with…"**

Render cannot reach MongoDB. Add `0.0.0.0/0` to your Atlas Network Access list.
Run `npm run seed` locally to get the full underlying error — it prints the
reason and exits the same way.

**"User already exists" / login fails after seeding**

`npm run seed` deletes all users before inserting new ones, and all demo
accounts share the password `password123`.

**Frontend loads but every API call fails**

In development the frontend must be told where the API lives. Confirm
`taskflow-frontend/.env.development` exists and contains:

```
VITE_API_URL=http://localhost:5001/api
```

Restart Vite after changing it — environment variables are read at startup.

**`EADDRINUSE: port already in use`**

A previous server is still running. On Windows:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5001
Stop-Process -Id <pid> -Force
```

**Blank page after logging in, or routes 404 on refresh**

The frontend has not been built, or the dev server is not running. Use
`npm run dev` for development, or `npm run build` before `npm start` for
production.

**"[Navbar] is not a `<Route>` component"**

`Navbar` and `Footer` cannot sit directly inside `<Routes>`. Wrap them in a
plain layout component, as `src/App.jsx` does.

**Lint reports `react-hooks/set-state-in-effect`**

Data fetching in an effect that immediately calls `setState` triggers
cascading renders. It is a real warning about re-render churn, not a syntax
error.

---

## License

MIT
