# TaskFlow

AI-integrated SaaS project management app for teams — manage projects, tasks, and members with Groq AI assistance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter routing, TailwindCSS, shadcn/ui, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcryptjs, token stored in localStorage as `taskflow_token`
- AI: Groq SDK, model `llama-3.1-8b-instant`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (users, projects, tasks, teams, team_members, comments, activity)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/` — generated React Query hooks + Zod schemas + custom-fetch
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — auth helpers, Groq client, logger
- `artifacts/taskflow/src/pages/` — all frontend pages
- `artifacts/taskflow/src/contexts/AuthContext.tsx` — auth state

## Architecture decisions

- JWT auth: tokens issued on login/register, stored in localStorage, attached via custom-fetch `Authorization: Bearer` header
- bcryptjs (pure JS) used instead of bcrypt to avoid native build script issues in Replit sandbox
- Orval codegen from OpenAPI spec generates all API hooks and Zod validation schemas — never hand-roll these
- `setAuthTokenGetter` in custom-fetch allows injecting tokens; fallback reads `taskflow_token` from localStorage directly
- AI routes call Groq with structured JSON mode (`response_format: { type: "json_object" }`) for reliable parsing

## Product

- **Auth**: register/login/logout/forgot-password with JWT
- **Dashboard**: project stats, activity feed, my tasks, completion metrics
- **Projects**: CRUD with task counts, completion rate, per-project stats
- **Tasks**: CRUD with filtering by project/assignee/status/priority, activity tracking
- **Teams**: CRUD team management with member assignment
- **Comments**: per-task comment threads
- **AI Hub**: task suggestion, prioritization, workload scheduling, user insights, risk alerts

## Demo credentials

- Admin: `admin@taskflow.demo` / `Admin123!`
- Member: `sarah@taskflow.demo` / `Member123!`
- Member: `marcus@taskflow.demo` / `Member123!`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT use `bcrypt` (native build scripts blocked). Use `bcryptjs` instead.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm run typecheck:libs` after changing lib packages before checking leaf artifacts
- JWT secret comes from `SESSION_SECRET` env var

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
