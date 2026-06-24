# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Start PostgreSQL (Docker), both servers together
npm run dev:db        # postgres on host port 5433
npm run db:migrate    # run Alembic migrations
npm run dev           # frontend (5173) + backend (8000) concurrently

# Run individually
npm run dev:frontend
npm run dev:backend
```

### Tests

```bash
# Frontend (Vitest)
cd frontend && npm run test:run          # all tests, once
cd frontend && npm test                  # watch mode

# Run a single frontend test file
cd frontend && npx vitest run src/hooks/useStudySession.test.ts

# Backend (pytest)
cd backend && .venv/bin/pytest           # all tests
cd backend && .venv/bin/pytest tests/test_words_api.py  # single file
```

### Build & lint

```bash
cd frontend && npm run build   # tsc -b + vite build
cd frontend && npm run lint    # eslint

# Lighthouse audits (require a Chrome binary; also run in CI)
cd frontend && npm run lighthouse:accessibility
cd frontend && npm run lighthouse:performance
```

### First-time setup

```bash
cd frontend && npm install
cd backend && python -m venv .venv && .venv/bin/pip install -e ".[dev]"
cp backend/.env.example backend/.env
npm install   # root (installs concurrently)
npm run dev:db && npm run db:migrate
```

## Architecture

### Overview

Monorepo with a root `package.json` that orchestrates both halves via `concurrently`. No shared code between frontend and backend — they communicate over HTTP through the Vite proxy (`/api` → `localhost:8000`).

### Backend (`backend/`)

FastAPI app (`app/main.py`) with three routers:
- `routers/auth.py` — register, login (OAuth2 password form), `/me`
- `routers/words.py` — CRUD + SRS review + Ollama enrich
- `routers/admin.py` — admin-only user summary

**Layering:** Routers depend on Pydantic schemas (`schemas/`), call repository interfaces (`repositories/word_repository.py`, `repositories/user_repository.py`), and use pure service functions (`services/srs.py`, `services/ollama.py`, `services/jwt.py`). The concrete implementations are `SqlAlchemyWordRepository` and `SqlAlchemyUserRepository`.

**Per-user isolation:** `repositories/dependencies.py` injects the authenticated user's `id` into `SqlAlchemyWordRepository`, so every query is automatically scoped to that user. All word endpoints are per-user; there is no admin word access.

**Auth flow:** JWT issued at login, verified in `auth/dependencies.py` → `get_current_user`. The admin role is seeded from env vars at startup (`db/seed.py`); registration always creates `role=user`.

**Database:** PostgreSQL via SQLAlchemy 2 + Alembic migrations. Alembic config is in `alembic.ini`; migration scripts in `alembic/versions/`.

**Tests** use an in-memory SQLite database via FastAPI dependency overrides (see `tests/conftest.py`). The `DISABLE_STARTUP_SEED=1` env var prevents the startup seeder from running during tests.

### Frontend (`frontend/src/`)

React 19 + React Router 7 + TypeScript. Vite dev server.

**React Compiler is enabled** (`babel-plugin-react-compiler` via `vite.config.ts`). Don't add manual `useMemo`/`useCallback`/`React.memo` — the compiler handles memoization. In return, the Rules of Hooks must be followed strictly or the compiler will bail out.

**Auth context:** `auth/AuthProvider.tsx` manages the current user and JWT token (stored via `auth/tokenStorage.ts`). It registers a global unauthorized handler so any 401 response from `api/http.ts` clears the session automatically.

**Routing + guards:** `routes/AppRouter.tsx` defines all routes. `routes/guards.tsx` provides `RequireAuth`, `RequireAdmin`, and `PublicOnly` wrapper components that read from `AuthContext`.

**API layer:** `api/http.ts` is the single fetch wrapper (attaches Bearer token, triggers unauthorized handler on 401). `api/wordsApi.ts` and `api/authApi.ts` are thin call wrappers. Types live in `api/types.ts` and `api/authTypes.ts`. The full API contract is documented in `api/contract.md`.

**Study session:** `hooks/useStudySession.ts` manages the due-word queue. On "didn't know", cards rotate back into the queue when the queue is small (`< 10`), otherwise they're dropped (next fetch will re-include them if still due).

**SRS duplication:** The SRS algorithm is intentionally duplicated. `srs/srs.ts` mirrors `backend/app/services/srs.py`; shared numeric constants are in `srs/constants.ts` (frontend) and `backend/app/services/srs_constants.py` (backend). When changing SRS behavior, update both sides.

**Testing:** Vitest + React Testing Library + MSW 2. Global MSW setup in `test/setup.ts` and `test/mswServer.ts`. Test fixtures in `test/fixtures.ts` and `test/authFixtures.ts`. Per-test handler overrides are registered via `server.use(...)` in individual test files.

### Deployment

Production target: Neon (Postgres) + Render (API) + Vercel (frontend). See `DEPLOY.md` and `render.yaml`. Ollama AI enrichment is local-only and does not work in production.

### CI

`.github/workflows/frontend-ci.yml` runs on PRs touching `frontend/**`: Vitest unit tests plus Lighthouse accessibility and performance audits (the build must pass for the audits to run). There is no backend CI — run `pytest` locally before pushing backend changes.
