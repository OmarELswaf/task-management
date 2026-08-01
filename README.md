# Task Management Application

A full-stack task management application built with React, TypeScript, and a local Supabase stack running entirely via Docker Compose. Users can create projects, manage tasks with status/priority/due-date filters, and collaborate via task-level comments — all isolated by Row-Level Security.

## Tech Stack

| Layer                | Technology                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| **Frontend**         | React 18, TypeScript, React Router v6, Tailwind CSS |
| **Auth**             | Supabase GoTrue v2.189 (local, auto-confirm enabled)                         |
| **API**              | PostgREST v14.12 (auto-generated REST from PostgreSQL schema)                |
| **Database**         | PostgreSQL 17 (Supabase build 17.6.1.136)                                    |
| **API Gateway**      | Kong 3.9 (routes `/auth/v1/` to GoTrue, `/rest/v1/` to PostgREST)            |
| **Web Server**       | Nginx (serves built SPA at `:5173`)                                          |
| **Containerization** | Docker & Docker Compose                                                      |
| **Testing**          | Vitest, React Testing Library, jsdom                                         |

## Architecture

```
                          ┌─────────────────────┐
                          │    Browser :5173     │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Nginx (frontend)  │
                          │    serves SPA       │
                          └──────────┬──────────┘
                                     │  /auth/v1/*, /rest/v1/*
                          ┌──────────▼──────────┐
                          │   Kong :8000        │
                          │   API Gateway       │
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

The frontend Nginx container serves the built React SPA at `localhost:5173`. The SPA calls the API at `localhost:8000`, which is handled by the Kong API gateway. Kong routes requests to `/auth/v1/` to GoTrue (port 9999) and requests to `/rest/v1/` to PostgREST (port 3000), plus the other Supabase services (storage, realtime, etc.). This keeps a single origin and eliminates CORS issues.

### Project Structure

```
├── docker-compose.yml        # Compose override (migrations, seed, frontend)
├── .env.example              # Environment variable template
├── frontend/
│   ├── Dockerfile            # Multi-stage build (Node → Nginx)
│   ├── nginx.conf            # SPA serving (API handled by Kong)
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
    ├── docker/               # Upstream Supabase compose (db, auth, rest, kong, …)
    ├── migrations/           # SQL migration files (applied in order)
    │   ├── 01-projects.sql
    │   ├── 02-tasks.sql
    │   ├── 03-comments.sql
    │   ├── 04-rls-policies.sql
    │   ├── 05-fix-table-grants.sql
    │   ├── 06-auto-user-id-trigger.sql
    │   ├── 07-add-project-color.sql
    │   └── 08-auto-updated-at.sql
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

| Service     | URL                   | Description            |
| ----------- | --------------------- | ---------------------- |
| Application | http://localhost:5173 | Main SPA               |
| PostgreSQL  | `localhost:5432`      | Direct database access |

### Pre-configured Test Accounts

| Email               | Password      | Role                                   |
| ------------------- | ------------- | -------------------------------------- |
| `alice@example.com` | `password123` | Has 3 projects with tasks and comments |
| `bob@example.com`   | `password123` | Has 1 project                          |

Registration is enabled — new accounts can be created from the Sign Up page.

## Testing

```bash
cd frontend
npm install
npm test          # Run all tests once
npm run test:watch  # Watch mode for development
```

Three test suites cover:

- **auth.test.tsx** — Authentication flows including login validation, sign-in, registration validation, and protected route behavior.
- **crud.test.tsx** — Project CRUD flows and task comment submission/display behavior.
- **filtering.test.tsx** — Search debounce, status/priority/date filters, clear filters behavior, and pagination rendering.

Current test status:

- 44 tests passing

### Verification Status

- **Production build:** ✅ Passing
- **Test suite:** ✅ 44/44 tests passing
- **Application behavior:** ✅ Verified manually with local Supabase stack

## Engineering Design Decisions

### Row-Level Security

All data access is governed by PostgreSQL Row-Level Security policies using `auth.uid()`:

- **Projects**: Each policy filters on `user_id = auth.uid()`. Users only see, create, update, and delete their own projects.
- **Tasks**: Policies use a correlated subquery (`EXISTS SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()`). This ensures task access is inherited from project ownership without duplicating the `user_id` column on tasks.
- **Comments**: SELECT/INSERT policies verify access through the task → project → user chain. DELETE is scoped to `author_id = auth.uid()`, meaning users can only delete their own comments but can view all comments on their projects.

This layered approach means the PostgREST API is safe to expose directly to the client — the database enforces isolation at the row level regardless of what the client requests.

### Local Supabase Stack Architecture

Instead of using Supabase Cloud or the Supabase CLI, the stack runs standard Docker images for each Supabase component:

- **supabase/postgres:17.6.1.136** — A PostgreSQL 17 image with the Supabase schema pre-installed (auth schema, pgcrypto, etc.). Migrations are mounted into `/docker-entrypoint-initdb.d/` for automatic execution on first database initialization.
- **supabase/gotrue:v2.189.0** — Standalone GoTrue server with auto-confirm enabled (no email verification), configured via `GOTRUE_MAILER_AUTOCONFIRM=true`.
- **postgrest/postgrest:v14.12** — Auto-generates a REST API from the `public` schema. Uses the `authenticator` role and `anon` role for JWT-based request authentication.
- **kong/kong:3.9.1** — API gateway that routes `/auth/v1/` to GoTrue and `/rest/v1/` to PostgREST.
- **Seed data** — `supabase/seed.sql` is mounted as `99-project-seed.sql` and runs on first database initialization, inserting test users (via `auth.users` + `auth.identities`), projects, tasks, and comments.

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
