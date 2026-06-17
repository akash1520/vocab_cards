# Deployment guide

Deploy Vocab Cards for free using three services — no credit card required for any of them.


| Service                      | Role            | Free limits                                        |
| ---------------------------- | --------------- | -------------------------------------------------- |
| [Neon](https://neon.tech)    | PostgreSQL      | 512 MB storage, 100 compute hours/month            |
| [Render](https://render.com) | FastAPI backend | 750 instance hours/month; sleeps after 15 min idle |
| [Vercel](https://vercel.com) | React frontend  | Unlimited deployments, 100 GB bandwidth/month      |


**Prerequisites:** code on GitHub, local `npm run dev` working.

**Production note:** Fill with AI (Ollama) is local-only and will not work in production.

---

## 1 — Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) → **New Project** → pick a name and region → **Create project**.
2. In **Connection details**, copy the **Connection string**:
  ```
   postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
3. Optionally verify connectivity from your machine:
  ```bash
   cd backend
   DATABASE_URL="<your-neon-url>" .venv/bin/alembic upgrade head
  ```

---

## 2 — Backend (Render)

### Option A — Blueprint (fastest)

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** → connect GitHub → select `vocab_cards`.
2. Render reads `render.yaml` and creates `vocab-cards-api`. Click **Apply**.
3. When prompted for environment variables:

  | Key              | Value                                                          |
  | ---------------- | -------------------------------------------------------------- |
  | `DATABASE_URL`   | Neon connection string from Step 1                             |
  | `CORS_ORIGINS`   | `https://placeholder.vercel.app` (update after Step 3)         |
  | `JWT_SECRET`     | A long random string — never use the dev default in production |
  | `ADMIN_EMAIL`    | Email for the seeded admin account                             |
  | `ADMIN_PASSWORD` | Password for the seeded admin account                          |

4. Wait for **Live** status. On start, Render runs `alembic upgrade head` then uvicorn (see `backend/scripts/start.sh`).

### Option B — Manual web service

**New +** → **Web Service** → connect repo → set:


| Field             | Value        |
| ----------------- | ------------ |
| Root directory    | `backend`    |
| Runtime           | Docker       |
| Dockerfile path   | `Dockerfile` |
| Health check path | `/health`    |


Add the same five env vars from Option A.

### Verify

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
# → {"status":"ok"}

curl https://YOUR-RENDER-URL.onrender.com/api/words
# → 401 (expected — auth required)
```

---

## 3 — Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New… → Project** → import `vocab_cards`.
2. Configure:

  | Field            | Value           |
  | ---------------- | --------------- |
  | Framework Preset | Vite            |
  | Root Directory   | `frontend`      |
  | Build Command    | `npm run build` |
  | Output Directory | `dist`          |

3. Add environment variable:

  | Name                | Value                                                      |
  | ------------------- | ---------------------------------------------------------- |
  | `VITE_API_BASE_URL` | `https://YOUR-RENDER-URL.onrender.com` (no trailing slash) |

4. **Deploy**. Copy your Vercel URL once the build finishes.

`frontend/vercel.json` rewrites all paths to `index.html` so React Router routes work on refresh.

---

## 4 — Wire CORS

The backend must allow requests from your Vercel domain.

1. Render dashboard → `vocab-cards-api` → **Environment**.
2. Set `CORS_ORIGINS` to your Vercel URL:
  ```
   CORS_ORIGINS=https://vocab-cards.vercel.app
  ```
3. **Save Changes** — Render redeploys automatically.

For multiple origins (e.g. preview deployments), comma-separate them with no spaces:

```
CORS_ORIGINS=https://vocab-cards.vercel.app,https://vocab-cards-git-main-you.vercel.app
```

---

## 5 — Smoke test

1. Open your Vercel URL → **Register** a new account (or sign in as the seeded admin).
2. **Add Words** → submit a word → success message appears.
3. **Study** → the word shows in the due queue → flip and review.
4. Confirm the API directly:
  ```bash
   curl https://YOUR-RENDER-URL.onrender.com/api/words \
     -H "Authorization: Bearer <token-from-login>"
  ```

---

## Redeploying


| Change           | Action                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| Frontend code    | Push to GitHub → Vercel auto-deploys                                             |
| Backend code     | Push to GitHub → Render auto-deploys + runs migrations                           |
| New DB migration | Add Alembic revision locally, push — Render runs `alembic upgrade head` on start |
| New Vercel URL   | Update `CORS_ORIGINS` on Render                                                  |
| New Render URL   | Update `VITE_API_BASE_URL` on Vercel, redeploy                                   |


---

## Troubleshooting

`**Failed to fetch` / network error in browser**

- `VITE_API_BASE_URL` must exactly match your Render URL, no trailing slash.
- Env vars on Vercel are baked in at build time — redeploy after any change.
- `CORS_ORIGINS` on Render must include your exact Vercel URL with `https://`.

**500 / database errors**

- Check Render **Logs** for connection errors.
- Neon URL must include `?sslmode=require`.

**First request takes 30–60 s**

- Expected on Render's free tier — the service was sleeping. Subsequent requests are fast.

`**/add-words` returns 404 on refresh**

- `frontend/vercel.json` must be present in the `frontend` directory Vercel builds from.

---

## Checklist

- [ ] Code pushed to GitHub
- [ ] Neon project created, connection string saved
- [ ] Render service live — `/health` returns `{"status":"ok"}`
- [ ] Vercel deployed with `VITE_API_BASE_URL` set
- [ ] `CORS_ORIGINS` on Render updated to Vercel URL
- [ ] Register, add a word, study — all work in the browser