# Vocab Cards

A vocabulary flashcard app with spaced repetition. React frontend + FastAPI backend.

## Prerequisites

- Node.js 18+
- Python 3.11+

## One-time setup

```bash
# Frontend dependencies
cd frontend && npm install

# Backend virtualenv and dependencies
cd ../backend
python -m venv .venv
.venv/bin/pip install -e ".[dev]"

# Optional: copy env file (defaults work for local SQLite)
cp .env.example .env
```

From the repo root, install the dev orchestration dependency:

```bash
npm install
```

## Run (development)

From the repo root:

```bash
npm run dev
```

This starts both servers:

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:8000    |

The Vite dev server proxies `/api` requests to the backend on port 8000.

### Run individually

```bash
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

## Configuration

- **Backend:** see [backend/.env.example](backend/.env.example) for `DATABASE_URL` and Ollama settings
- **Frontend:** see [frontend/.env.example](frontend/.env.example) for optional `VITE_API_BASE_URL` (not needed when using the Vite proxy)
