# Vocab Cards

A vocabulary flashcard app with spaced repetition. React frontend + FastAPI backend.

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (for local PostgreSQL)

## One-time setup

```bash
# Frontend dependencies
cd frontend && npm install

# Backend virtualenv and dependencies
cd ../backend
python -m venv .venv
.venv/bin/pip install -e ".[dev]"

cp .env.example .env
```

From the repo root, install the dev orchestration dependency:

```bash
npm install
```

Start PostgreSQL and apply migrations:

```bash
npm run dev:db
npm run db:migrate
```

PostgreSQL runs on host port **5433** (mapped from container 5432) to avoid conflicting with a local Postgres on 5432.

## Run (development)

From the repo root:

```bash
npm run dev
```

This starts both servers:

| Service    | URL                      |
|------------|--------------------------|
| Frontend   | http://localhost:5173    |
| Backend    | http://localhost:8000    |
| PostgreSQL | localhost:5433           |

The Vite dev server proxies `/api` requests to the backend on port 8000.

### Run individually

```bash
npm run dev:db         # PostgreSQL only (Docker)
npm run db:migrate     # Apply Alembic migrations
npm run dev:frontend   # Vite only
npm run dev:backend    # FastAPI only
```

## Verify

1. Open http://localhost:5173
2. Go to **Add Words**, submit a word — you should see a success message
3. Go to **Study** — the due queue loads (or shows an empty-state message, not a connection error)
4. Quick API check: `curl http://localhost:8000/api/words`

## Tests

```bash
cd frontend && npm run test:run
cd backend && .venv/bin/pytest
```

Backend tests use an in-memory SQLite database through the same `SqlAlchemyWordRepository` implementation.

## Local LLM (Ollama)

The **Fill with AI** button on Add Words calls `POST /api/words/enrich`, which uses [Ollama](https://ollama.com) running on your machine.

### One-time Ollama setup

```bash
# Install Ollama from https://ollama.com, then pull a model:
ollama pull llama3

# Ollama usually runs automatically; if not:
ollama serve
```

### Backend configuration

Copy and edit `backend/.env` (see [backend/.env.example](backend/.env.example)):

```
DATABASE_URL=postgresql+psycopg://vocab:vocab@localhost:5433/vocab_cards
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

Use the model name from `ollama list`. The default is `llama3`.

### Using Fill with AI

1. Start Ollama and ensure the backend is running (`npm run dev`)
2. Open **Add Words**, enter a term, click **Fill with AI**
3. Review and edit the suggested fields, then click **Add word**

If Ollama is not running, the form shows: *Ollama is unreachable. Start Ollama and pull a model.*

## Configuration

- **Backend:** see [backend/.env.example](backend/.env.example) for `DATABASE_URL`, `CORS_ORIGINS`, and Ollama settings
- **Frontend:** see [frontend/.env.example](frontend/.env.example) for optional `VITE_API_BASE_URL` (not needed when using the Vite proxy)

## Production deploy (Vercel + Neon + Render)

Free-tier split deployment:

| Service | Host | Role |
|---------|------|------|
| [Neon](https://neon.tech) | Postgres | Database |
| [Render](https://render.com) | Web service | FastAPI API |
| [Vercel](https://vercel.com) | Static site | React frontend |

**Note:** Fill with AI (Ollama) only works locally. In production the enrich endpoint will return 503 unless you add a cloud LLM later.

### 1. Neon (database)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string (`postgresql://...`)
3. Paste it as `DATABASE_URL` on Render — the backend auto-converts it to `postgresql+psycopg://`

Run migrations once locally against Neon (optional sanity check):

```bash
cd backend
DATABASE_URL="postgresql://..." .venv/bin/alembic upgrade head
```

### 2. Render (backend)

**Option A — Blueprint (recommended)**

1. Push this repo to GitHub
2. In Render: **New → Blueprint** → connect the repo
3. Render reads [`render.yaml`](render.yaml) and creates the web service
4. Set environment variables in the Render dashboard:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Neon connection string |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |

5. Deploy. The Docker image runs migrations then starts uvicorn.
6. Verify: `curl https://your-api.onrender.com/health` → `{"status":"ok"}`

**Option B — Manual**

1. **New → Web Service** → connect repo
2. **Root directory:** `backend`
3. **Runtime:** Docker (uses [`backend/Dockerfile`](backend/Dockerfile))
4. Set `DATABASE_URL` and `CORS_ORIGINS` as above

Free Render web services spin down when idle; the first request after sleep may take 30–60 seconds.

### 3. Vercel (frontend)

1. Import the repo at [vercel.com](https://vercel.com)
2. **Root directory:** `frontend`
3. **Framework preset:** Vite
4. **Build command:** `npm run build`
5. **Output directory:** `dist`
6. **Environment variable:**

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://your-api.onrender.com` (no trailing slash) |

7. Deploy. [`frontend/vercel.json`](frontend/vercel.json) rewrites all routes to `index.html` for React Router.

### 4. Wire CORS

After Vercel gives you a URL (e.g. `https://vocab-cards.vercel.app`), update Render:

```
CORS_ORIGINS=https://vocab-cards.vercel.app
```

For preview deployments, add each Vercel preview URL to `CORS_ORIGINS` as a comma-separated list, or use only your production URL.

Redeploy the Render service after changing env vars.

### 5. Smoke test

1. Open your Vercel URL
2. Add a word on **Add Words**
3. Study the due queue on **Study**
4. `curl https://your-api.onrender.com/api/words` should return JSON

### Local Docker build (optional)

Test the production image locally:

```bash
docker build -t vocab-cards-api ./backend
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://vocab:vocab@host.docker.internal:5433/vocab_cards" \
  -e CORS_ORIGINS="http://localhost:5173" \
  vocab-cards-api
```
