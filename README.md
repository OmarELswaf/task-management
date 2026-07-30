# Task Management Application

A full-stack task management application built with React, TypeScript, and a local Supabase stack running entirely via Docker Compose. Users can create projects, manage tasks with status/priority/due-date filters, and collaborate via task-level comments — all isolated by Row-Level Security.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, React Router v6, Tailwind CSS, shadcn/ui, Lucide React |
| **Auth** | Supabase GoTrue v2.153 (local, auto-confirm enabled) |
| **API** | PostgREST v12.2 (auto-generated REST from PostgreSQL schema) |
| **Database** | PostgreSQL 15 (Supabase build 15.8.1.020) |
| **Reverse Proxy** | Nginx (serves SPA, routes `/auth/v1/` and `/rest/v1/`) |
| **Containerization** | Docker & Docker Compose |
| **Testing** | Vitest, React Testing Library, jsdom |

## Architecture

```
                          ┌─────────────────────┐
                          │    Browser :5173     │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Nginx (frontend)  │
                          │   SPA + API Proxy   │
                          └──┬──────────────┬───┘
                             │              │
                    ┌────────▼───┐   ┌──────▼────────┐
                    │ /auth/v1/* │   │ /rest/v1/*    │
                    │ GoTrue     │   │ PostgREST     │
                    │ :9999      │   │ :3000         │
                    └──────┬─────┘   └──────┬────────┘
                           │                │
                           └────────┬───────┘
                                    │
                          ┌─────────▼─────────┐
                          │   PostgreSQL :5432 │
                          │   + pgcrypto       │
                          └───────────────────┘
```

The frontend Nginx container serves the built React SPA at `localhost:5173` and acts as a reverse proxy for the Supabase services. All browser requests to `/auth/v1/` are forwarded to GoTrue (port 9999) and requests to `/rest/v1/` are forwarded to PostgREST (port 3000). This eliminates CORS issues and keeps a single origin.

### Project Structure

```
├── docker-compose.yml        # Full stack orchestration (db, auth, rest, frontend, seed)
├── .env.example              # Environment variable template
├── frontend/
│   ├── Dockerfile            # Multi-stage build (Node → Nginx)
│   ├── nginx.conf            # Reverse proxy + SPA fallback
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── common/       #   Pagination, ProtectedRoute
│   │   │   ├── projects/     #   ProjectCard, ProjectModal
│   │   │   ├── tasks/        #   TaskCard, TaskModal, TaskFilters, TaskDetailModal
│   │   │   └── comments/     #   CommentSection
│   │   ├── contexts/         # AuthContext (session + auth state)
│   │   ├── hooks/            # useProjects, useTasks, useComments
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register
│   │   │   └── projects/     # ProjectsList, ProjectDetail
│   │   ├── lib/              # supabase client, utils
│   │   ├── types/            # Database type definitions
│   │   └── tests/            # Vitest test suites
│   └── package.json
└── supabase/
    ├── migrations/           # SQL migration files (applied in order)
    │   ├── 01-projects.sql
    │   ├── 02-tasks.sql
    │   ├── 03-comments.sql
    │   └── 04-rls-policies.sql
    └── seed.sql              # Test users, projects, tasks, comments
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd HomeAssignment

# 2. Copy environment file and customize (optional)
cp .env.example .env

# 3. Start everything with a single command
docker compose up --build
```

The first build may take several minutes (installing npm dependencies, pulling Docker images). Subsequent starts are near-instant.

### Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Application | http://localhost:5173 | Main SPA |
| PostgreSQL | `localhost:5432` | Direct database access |

### Pre-configured Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `alice@example.com` | `password123` | Has 3 projects with tasks and comments |
| `bob@example.com` | `password123` | Has 1 project |

Registration is enabled — new accounts can be created from the Sign Up page.

## Testing

```bash
cd frontend
npm install
npm test          # Run all tests once
npm run test:watch  # Watch mode for development
```

Three test suites cover:

- **auth.test.ts** (13 tests) — Login validation (empty fields, invalid email, short password), sign-in submission, failed sign-in errors, registration password confirmation, ProtectedRoute redirects and loading states.
- **crud.test.ts** (8 tests) — Project empty state, create flow, name validation, server error display; comment submission and display.
- **filtering.test.ts** (12 tests) — Debounced search (300ms), immediate status/priority/date selectors, clear filters; Pagination boundary conditions, ellipsis rendering, active page highlighting.

## Engineering Design Decisions

### Row-Level Security

All data access is governed by PostgreSQL Row-Level Security policies using `auth.uid()`:

- **Projects**: Each policy filters on `user_id = auth.uid()`. Users only see, create, update, and delete their own projects.
- **Tasks**: Policies use a correlated subquery (`EXISTS SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()`). This ensures task access is inherited from project ownership without duplicating the `user_id` column on tasks.
- **Comments**: SELECT/INSERT policies verify access through the task → project → user chain. DELETE is scoped to `author_id = auth.uid()`, meaning users can only delete their own comments but can view all comments on their projects.

This layered approach means the PostgREST API is safe to expose directly to the client — the database enforces isolation at the row level regardless of what the client requests.

### Local Supersetack Architecture

Instead of using Supabase Cloud or the Supabase CLI, the stack runs standard Docker images for each Supabase component:

- **supabase/postgres:15.8.1.020** — A PostgreSQL 15 image with the Supabase schema pre-installed (auth schema, pgcrypto, etc.). Migrations are mounted into `/docker-entrypoint-initdb.d/` for automatic execution on first database initialization.
- **supabase/gotrue:v2.153.0** — Standalone GoTrue server with auto-confirm enabled (no email verification), configured via `GOTRUE_MAILER_AUTOCONFIRM=true`.
- **postgrest/postgrest:v12.2.0** — Auto-generates a REST API from the `public` schema. Uses the `authenticator` role and `anon` role for JWT-based request authentication.
- **seed container** — An ephemeral Alpine container that runs after the database and auth services are healthy, inserting test users (via `auth.users` + `auth.identities`), projects, tasks, and comments.

This approach provides a production-like Supabase experience locally without external dependencies or a Supabase account.

### State Synchronization via URL Search Params

Search queries, status/priority filters, and pagination are persisted in URL search parameters (`/projects?search=...&page=2`). This provides:

- **Shareable/bookmarkable URLs** — A user can bookmark a filtered view and return to it later.
- **Browser history integration** — Back/forward navigation restores filter state without React state management overhead.
- **No additional state library** — URL is the single source of truth for filter state, eliminating the need for Zustand/Redux for this concern.

## Performance Optimizations

- **Nginx static asset caching** — JavaScript, CSS, images, and fonts are served with `Cache-Control: public, immutable` and a 1-year expiry. The SPA HTML is served with `Cache-Control: no-cache, must-revalidate` to ensure users always get the latest app shell.
- **Gzip compression** — Enabled for text-based content types (HTML, CSS, JS, JSON, SVG).
- **Debounced search** — The TaskFilters component debounces search input by 300ms before updating the URL, reducing unnecessary API calls.
- **PostgREST row limits** — `PGRST_DB_MAX_ROWS=100` prevents accidental full-table scans.

## Known Limitations

- **No pagination cursor support** — Uses offset-based pagination via `range` headers. At high page depths this becomes inefficient compared to cursor-based keyset pagination.
- **Single-user task assignment** — Tasks can be assigned to a single user via `assignee_id`. No team or multi-assignee support.
- **No real-time updates** — The application uses manual refresh and polling. Supabase Realtime (websocket-based subscriptions) is not configured.
- **No file attachments** — Tasks and comments support only text content.
- **No email notifications** — While GoTrue has SMTP support, the local setup uses auto-confirm. A production setup would require an SMTP provider and notification workflows.
- **Auto-scaling** — Docker Compose single-host setup. No horizontal scaling or load balancing.

## Production Deployment Considerations

To move from the local Docker setup to production:

1. **Database** — Migrate from the local PostgreSQL container to a managed service (Supabase Cloud, AWS RDS, or similar) with automated backups and point-in-time recovery.
2. **GoTrue** — Configure a real SMTP provider, disable auto-confirm, set a strong `JWT_SECRET` (32+ random bytes), and reduce JWT expiry from 3600s to a value appropriate for the application.
3. **PostgREST** — Enable connection pooling, increase `PGRST_DB_MAX_ROWS` if needed (with pagination), and add rate limiting at the proxy layer.
4. **Frontend** — Build the React app with production environment variables pointing to the production Supabase endpoints. Deploy the Nginx container behind a CDN (CloudFront, Cloudflare) for global edge caching.
5. **Orchestration** — Replace Docker Compose with Kubernetes or a container orchestration service (ECS, GKE) for auto-scaling, rolling updates, and secret management.
6. **Observability** — Add structured logging (ELK stack or similar), application performance monitoring, and uptime monitoring (Pingdom, Datadog).
