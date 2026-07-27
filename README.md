# ProjectFlow

A production-grade Task & Project Management Platform with Analytics, built with React, Express.js, TypeScript, PostgreSQL, and Prisma.

---

## Architecture

```
project/
├── server/          Express.js REST API (TypeScript)
│   ├── src/
│   │   ├── config/       Environment validation, constants
│   │   ├── errors/       Custom error class hierarchy
│   │   ├── lib/          Prisma client singleton
│   │   ├── middleware/    Auth, validation, logging, rate limiting, error handling
│   │   ├── modules/      Domain modules (auth, projects, tasks, comments, analytics)
│   │   ├── types/        TypeScript interfaces and augmentations
│   │   └── utils/        Logger, JWT, password hashing, pagination, query builder
│   ├── prisma/           Schema, migrations, seed
│   └── tests/            Integration tests
├── client/          React SPA (TypeScript, Vite, Tailwind)
│   └── src/
│       ├── api/          Axios client + API modules
│       ├── components/   Reusable UI and domain components
│       ├── hooks/        React Query hooks
│       ├── lib/          Auth helpers, utility functions
│       ├── pages/        Route-level page components
│       └── types/        Shared TypeScript types
├── docker/          Dockerfile for unified single-service build
├── docs/            API reference and architecture documentation
├── .github/         CI/CD workflow
└── docker-compose.yml
```

### Key Design Decisions

- **Single-service deployment**: In production, Express serves both the REST API (`/api/*`) and the built SPA (`client/dist/`). No separate frontend server needed.
- **Modular Architecture**: Each domain (auth, projects, tasks, comments, analytics) is self-contained with routes, controller, service, and schema.
- **Separation of Concerns**: Controllers handle HTTP, services handle business logic, middleware handles cross-cutting.
- **Centralized Error Handling**: Custom error classes propagate through Express error middleware.
- **Type Safety**: End-to-end TypeScript with Zod validation schemas.
- **Optimistic UI**: React Query handles caching, refetching, and optimistic updates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript |
| Backend | Express.js 4 |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Logging | Pino (structured JSON) |
| Security | Helmet, CORS, rate limiting |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | TanStack React Query |
| Charts | Recharts |

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or Docker)
- npm 10+

### Development

```bash
cd project
npm install

# Start PostgreSQL (Docker)
docker compose up -d postgres

# Configure environment
cp .env.example server/.env
# Edit server/.env with your values

# Run migrations and seed
npm run db:migrate -w server
npm run db:seed -w server

# Start both servers
npm run dev
```

The API runs on `http://localhost:3001` and the Vite dev server on `http://localhost:5173`.

### Docker (Production-like)

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on `:5432`
- **Unified server** (API + SPA) on `:3001`

Open `http://localhost:3001` — the SPA and API are served from the same origin.

Seed the database:
```bash
docker compose exec server npx prisma db seed --schema=server/prisma/schema.prisma
```

Demo credentials: `demo@projectflow.com` / `password123`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | Access token signing secret (min 16 chars) |
| `JWT_REFRESH_SECRET` | — | Refresh token signing secret (min 16 chars) |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

---

## API Overview

**Base URL:** `http://localhost:3001` (development) or your production domain.  
**Auth:** `Authorization: Bearer <accessToken>`  

All 25 endpoints are documented in full at [`docs/api.md`](docs/api.md).

| Module | Endpoints |
|--------|-----------|
| Health | `GET /health`, `/health/live`, `/health/ready` |
| Auth | `POST /register`, `/login`, `/refresh`, `GET /me` |
| Projects | `GET /projects`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Tasks | `GET /tasks/project/:projectId`, `POST`, `GET /:id`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id` |
| Comments | `GET /comments/task/:taskId`, `POST`, `DELETE /:id` |
| Analytics | `GET /analytics/overview`, `/analytics/projects/:id`, `/analytics/activity` |

### In Production

When running with `NODE_ENV=production`, the server also serves the React SPA:
- `GET /` — loads the app
- `GET /dashboard`, `/projects`, etc. — client-side routes return `index.html`
- `GET /api/v1/*` — API routes return JSON
- `GET /assets/*` — static build files

---

## Deployment

### Docker (Any Host)

```bash
docker compose up --build -d
```

Then seed (first time only):
```bash
docker compose exec server npx prisma db seed --schema=server/prisma/schema.prisma
```

### Render

Create a **Web Service** + **PostgreSQL** database on Render.

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run render-build` |
| **Start Command** | `npm start` |

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Render PostgreSQL internal URL |
| `JWT_ACCESS_SECRET` | Random string (min 16 chars) |
| `JWT_REFRESH_SECRET` | Different random string (min 16 chars) |
| `NODE_ENV` | `production` |
| `PORT` | (Render sets automatically) |

After first deploy, run once:
```bash
npm run db:seed -w server
```

---

## Testing

```bash
# Run server tests (integration)
npm test

# Run with coverage
npm run test:coverage -w server

# Run client tests
npm run test:client

# Watch mode
npm run test:watch -w server
```

### Test Coverage

- Auth: registration, login, token refresh, validation
- Projects: CRUD, ownership, authorization
- Tasks: CRUD, status transitions, filtering, sorting
- Comments: CRUD, author-only deletion
- Analytics: overview, project analytics, activity feed
- Health endpoints and 404 handling

---

## Security

- bcrypt password hashing (12 rounds)
- JWT access tokens (15 min) + refresh tokens (7 days)
- Rate limiting (100 req/15min general, 10 req/15min auth)
- Helmet security headers
- CORS restricted to configured origin
- Input validation on all endpoints (Zod)
- Parameterized queries via Prisma (SQL injection prevention)
- No secrets in repository
- XSS protection via input sanitization

---

## Documentation

| File | Description |
|------|-------------|
| [`docs/api.md`](docs/api.md) | Complete API reference with all 25 endpoints, request/response schemas, error codes |
| [`docs/architecture.md`](docs/architecture.md) | System architecture, request lifecycle, auth flow, database ERD, deployment diagrams |

---

## License

ISC
