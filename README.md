# TaskFlow

Project task manager — React (Vite) frontend + Express/MongoDB backend.

## Quick start

```bash
npm run setup   # first time only — installs both workspaces' dependencies
npm run dev     # starts backend (:5001) and frontend (:5173) together
```

Then open <http://localhost:5173>.

`npm run dev` runs both processes in one terminal with coloured `[backend]` /
`[frontend]` prefixes. Closing the terminal (or pressing `Ctrl+C`) stops both.

## Ports

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | <http://localhost:5173>        |
| Backend  | <http://localhost:5001>        |
| Health   | <http://localhost:5001/health> |

The frontend talks to the backend through `taskflow-frontend/src/api/api.js`
(`http://localhost:5001/api`, `withCredentials: true`). Auth uses an httpOnly
cookie named `token` — nothing is stored in `localStorage` or `sessionStorage`.

## Commands

Run from the repository root:

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `npm run setup`    | Installs backend and frontend dependencies       |
| `npm run dev`      | Runs backend + frontend together                 |
| `npm run seed`     | Seeds demo users, projects, tasks and comments   |
| `npm run build`    | Production build of the frontend                 |
| `npm run lint`     | ESLint over the frontend                         |
| `npm start`        | Production-mode backend only                     |

Run a single service on its own:

```bash
npm run dev:backend
npm run dev:frontend
```

## Demo accounts

After `npm run seed`, every account uses the password `password123`:

| Email                    | Role in the seeded project |
| ------------------------ | -------------------------- |
| `owner@taskflow.com`     | Owner                      |
| `admin@taskflow.com`     | Admin                      |
| `member@taskflow.com`    | Member                     |

Only Owners and Admins can edit a project; only Owners can add or remove
members.

## Environment

The backend reads `taskflow-backend/.env`:

```
PORT=5001
MONGODB_URL=mongodb://localhost:27017/taskflow
JWT_SECRET=<your secret>
```

Note it is `MONGODB_URL`. On MongoDB Atlas the database name must be in the
URL (`.../taskflow`) — without it Mongoose silently uses the `test` database.
Render also needs `0.0.0.0/0` under Atlas → Network Access, because Render's
outbound IPs are dynamic.

## Layout

```
taskflow/
├─ package.json          # root orchestrator (concurrently)
├─ taskflow-backend/     # Express API
└─ taskflow-frontend/    # React + Vite app
```
