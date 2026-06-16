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

- **Backend:** see [backend/.env.example](backend/.env.example) for `DATABASE_URL` and Ollama settings
- **Frontend:** see [frontend/.env.example](frontend/.env.example) for optional `VITE_API_BASE_URL` (not needed when using the Vite proxy)
