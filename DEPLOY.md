# Deployment guide — Vercel + Neon + Render

Step-by-step instructions to deploy **Vocab Cards** to free tiers:

| Service | What it hosts |
|---------|----------------|
| [Neon](https://neon.tech) | PostgreSQL database |
| [Render](https://render.com) | FastAPI backend |
| [Vercel](https://vercel.com) | React frontend (static) |

```mermaid
flowchart LR
  Browser --> Vercel["Vercel frontend"]
  Vercel -->|"HTTPS /api/*"| Render["Render API"]
  Render --> Neon["Neon Postgres"]
```

**Before you start**

- Code pushed to a **GitHub** repository (Render and Vercel connect via GitHub).
- Accounts on Neon, Render, and Vercel (all have free tiers).
- Local app works (`npm run dev`).

**Production limitations**

- **Fill with AI** uses Ollama locally only. In production, that button will error unless you add a cloud LLM later.
- Render free web services **sleep when idle**. The first request after sleep can take 30–60 seconds.

---

## Step 0 — Push code to GitHub

If you have not already:

```bash
git remote add origin git@github.com:YOUR_USER/vocab_cards.git
git push -u origin main
```

Replace `YOUR_USER` with your GitHub username.

---

## Step 1 — Create the database (Neon)

### 1.1 Sign up and create a project

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Click **New Project**.
3. Choose a name (e.g. `vocab-cards`).
4. Pick a region close to you.
5. Click **Create project**.

### 1.2 Copy the connection string

1. On the project dashboard, open **Connection details**.
2. Select **Connection string**.
3. Copy the URI. It looks like:

   ```
   postgresql://neondb_owner:xxxxxxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. Save this somewhere safe — you will use it as `DATABASE_URL` on Render.

> The backend automatically converts `postgresql://` to `postgresql+psycopg://` for SQLAlchemy. Paste Neon’s string as-is.

### 1.3 (Optional) Run migrations from your machine

Verify the database is reachable before deploying the API:

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -e .
DATABASE_URL="postgresql://YOUR_NEON_CONNECTION_STRING" .venv/bin/alembic upgrade head
```

You should see Alembic apply revision `001` (initial `words` table).

---

## Step 2 — Deploy the API (Render)

You can use the **Blueprint** (reads `render.yaml` from the repo) or configure manually. Blueprint is faster.

### Option A — Blueprint (recommended)

#### 2A.1 Create the Blueprint

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account if prompted.
4. Select the `vocab_cards` repository.
5. Render detects [`render.yaml`](render.yaml) and shows a service named `vocab-cards-api`.
6. Click **Apply**.

#### 2A.2 Set environment variables

Render prompts for variables marked `sync: false` in the blueprint:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Your Neon connection string | Full `postgresql://...` URI from Step 1 |
| `CORS_ORIGINS` | `https://placeholder.vercel.app` | Temporary — update after Step 3 |

Use a placeholder for `CORS_ORIGINS` for now. You will set the real Vercel URL in Step 4.

#### 2A.3 Wait for deploy

1. Render builds the Docker image from [`backend/Dockerfile`](backend/Dockerfile).
2. On start, [`backend/scripts/start.sh`](backend/scripts/start.sh) runs `alembic upgrade head`, then uvicorn.
3. When status is **Live**, copy your service URL (e.g. `https://vocab-cards-api.onrender.com`).

#### 2A.4 Verify the API

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
```

Expected:

```json
{"status":"ok"}
```

```bash
curl https://YOUR-RENDER-URL.onrender.com/api/words
```

Expected: `[]` or a JSON array of words.

---

### Option B — Manual web service

Use this if you prefer not to use the Blueprint.

1. **New +** → **Web Service** → connect the repo.
2. Settings:

   | Field | Value |
   |-------|-------|
   | Name | `vocab-cards-api` |
   | Root directory | `backend` |
   | Runtime | **Docker** |
   | Dockerfile path | `Dockerfile` (relative to root directory) |

3. **Environment** → add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Neon connection string |
   | `CORS_ORIGINS` | `https://placeholder.vercel.app` |

4. **Health check path:** `/health`
5. Click **Create Web Service** and wait until **Live**.
6. Run the same `curl` checks as in Step 2A.4.

---

## Step 3 — Deploy the frontend (Vercel)

### 3.1 Import the project

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New…** → **Project**.
3. Import the `vocab_cards` repository.

### 3.2 Configure the build

On the import screen, set:

| Field | Value |
|-------|-------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 3.3 Add environment variable

Expand **Environment Variables** and add:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://YOUR-RENDER-URL.onrender.com` |

**Important:** No trailing slash. Example:

```
https://vocab-cards-api.onrender.com
```

This is baked in at build time. The browser calls `https://your-api.onrender.com/api/words` directly (there is no Vite proxy in production).

### 3.4 Deploy

1. Click **Deploy**.
2. Wait for the build to finish.
3. Copy your production URL (e.g. `https://vocab-cards.vercel.app`).

[`frontend/vercel.json`](frontend/vercel.json) rewrites all paths to `index.html` so React Router routes (`/`, `/add-words`) work on refresh.

---

## Step 4 — Connect frontend and backend (CORS)

The browser blocks API calls unless the backend allows your Vercel origin.

### 4.1 Update Render

1. Open the `vocab-cards-api` service on Render.
2. Go to **Environment**.
3. Set `CORS_ORIGINS` to your Vercel URL:

   ```
   CORS_ORIGINS=https://vocab-cards.vercel.app
   ```

   Use your actual URL from Step 3.4.

4. Click **Save Changes**. Render redeploys automatically.

### 4.2 Multiple origins (optional)

For production **and** a specific preview URL, use a comma-separated list (no spaces):

```
CORS_ORIGINS=https://vocab-cards.vercel.app,https://vocab-cards-git-main-youruser.vercel.app
```

Wildcards are not supported — add each origin explicitly.

---

## Step 5 — End-to-end smoke test

1. Open your Vercel URL in the browser.
2. Go to **Add Words**, fill in a word, click **Add word** → success message.
3. Go to **Study** → the word appears in the due queue.
4. Flip the card, tap **I know this word** or **Still learning**.
5. In a terminal:

   ```bash
   curl https://YOUR-RENDER-URL.onrender.com/api/words
   ```

   You should see the word you added.

If something fails, see [Troubleshooting](#troubleshooting) below.

---

## Step 6 — Redeploying after code changes

| Change | What to do |
|--------|------------|
| Frontend only | Push to GitHub → Vercel auto-deploys |
| Backend only | Push to GitHub → Render auto-deploys (runs migrations on start) |
| Database schema | Add Alembic migration locally, push, Render runs `alembic upgrade head` on deploy |
| New Vercel URL | Update `CORS_ORIGINS` on Render |
| New Render URL | Update `VITE_API_BASE_URL` on Vercel, trigger redeploy |

---

## Environment variable reference

### Render (backend)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon `postgresql://...` connection string |
| `CORS_ORIGINS` | Yes | `https://vocab-cards.vercel.app` |
| `OLLAMA_BASE_URL` | No | Only for local Ollama |
| `OLLAMA_MODEL` | No | Only for local Ollama |

### Vercel (frontend)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes (production) | `https://vocab-cards-api.onrender.com` |

---

## Troubleshooting

### `Failed to fetch` or network error in the browser

- Confirm `VITE_API_BASE_URL` on Vercel matches your Render URL (no trailing slash).
- Redeploy Vercel after changing env vars (they apply at **build** time).
- Confirm `CORS_ORIGINS` on Render includes your exact Vercel URL (`https://`, no trailing slash).

### API returns 500 / database errors

- Check Render **Logs** for connection errors.
- Verify `DATABASE_URL` is the full Neon string including `?sslmode=require`.
- Run migrations manually (Step 1.3) to confirm the DB is reachable.

### First request is very slow (~30–60 s)

- Normal on Render’s free tier — the service was sleeping. Subsequent requests are fast until the next idle period.

### `/add-words` shows 404 on refresh (before Vercel deploy)

- Ensure [`frontend/vercel.json`](frontend/vercel.json) is deployed. It must be in the `frontend` directory Vercel builds from.

### Fill with AI fails in production

- Expected. Ollama runs locally only. Add words manually in production, or integrate a cloud LLM API later.

### CORS error mentioning `localhost:5173`

- Production frontend is calling the API but `CORS_ORIGINS` still points at localhost. Update it to your Vercel URL on Render.

---

## Optional — Test the Docker image locally

```bash
# Start local Postgres (from repo root)
npm run dev:db
npm run db:migrate

# Build and run the production image
docker build -t vocab-cards-api ./backend
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://vocab:vocab@host.docker.internal:5433/vocab_cards" \
  -e CORS_ORIGINS="http://localhost:5173" \
  vocab-cards-api
```

Then open `http://localhost:5173` with `VITE_API_BASE_URL=http://localhost:8000` or curl `http://localhost:8000/health`.

---

## Quick checklist

- [ ] Code on GitHub
- [ ] Neon project created, connection string copied
- [ ] Render service live, `/health` returns OK
- [ ] Vercel deployed with `VITE_API_BASE_URL`
- [ ] `CORS_ORIGINS` on Render set to Vercel URL
- [ ] Add word + study flow works in the browser
