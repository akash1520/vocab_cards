# API contract

The frontend expects a FastAPI backend implementing these endpoints. Types are defined in [`types.ts`](./types.ts) and [`authTypes.ts`](./authTypes.ts).

All word and admin routes require `Authorization: Bearer <access_token>` from login.

## Auth

### `User`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique identifier |
| `email` | `string` | User email |
| `role` | `'user' \| 'admin'` | Admin is seeded from env; registration always creates `user` |
| `created_at` | `string` | ISO datetime |

### `POST /api/auth/register`

Creates a new account (`role=user`).

**Body:**

```json
{ "email": "user@example.com", "password": "password123" }
```

**Response:** `User` (`201`)

**Errors:** `409` — email already registered

### `POST /api/auth/login`

OAuth2 password flow. Form fields: `username` (email) and `password`.

**Response:**

```json
{ "access_token": "…", "token_type": "bearer" }
```

**Errors:** `401` — incorrect email or password

### `GET /api/auth/me`

Returns the authenticated `User`.

**Errors:** `401` — missing or invalid token

## Admin

### `GET /api/admin/users`

Admin only. Returns aggregate per-user stats (no per-word drill-down).

**Response:** `AdminUserSummary[]`

```json
[
  {
    "id": "…",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2026-01-01T00:00:00.000Z",
    "word_count": 12,
    "due_count": 3
  }
]
```

**Errors:** `401` — not authenticated; `403` — not admin

## `Word`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique identifier |
| `term` | `string` | Vocabulary word |
| `part_of_speech` | `string` | e.g. `verb`, `adjective` |
| `definition` | `string` | Primary definition |
| `synonyms` | `string[]` | Related words |
| `example_sentence` | `string` | Usage example |
| `ease_factor` | `number` | Default `2.5` |
| `interval_days` | `number` | Default `0` |
| `repetitions` | `number` | Default `0` |
| `next_review_at` | `string \| null` | ISO datetime; `null` = due now |
| `status` | `'new' \| 'learning' \| 'review' \| 'mastered'` | SRS state |

## Endpoints

### `GET /api/words`

Returns all words for the authenticated user.

### `GET /api/words/due?limit=20`

Returns words where `next_review_at` is `null` or `<= now`, ordered by urgency, for the authenticated user.

### `POST /api/words`

Creates a word. Backend initializes SRS fields.

**Body:** `CreateWordInput`

```json
{
  "term": "ephemeral",
  "part_of_speech": "adjective",
  "definition": "lasting a very short time",
  "synonyms": ["fleeting", "transient"],
  "example_sentence": "The ephemeral beauty of cherry blossoms draws crowds each spring."
}
```

**Errors:** `4xx` responses should include `{ "detail": "message" }`.

### `POST /api/words/enrich`

Suggests card fields for a term using a local LLM (Ollama). Does not persist.

**Body:**

```json
{ "term": "ephemeral" }
```

**Response:** `EnrichWordResponse` (same shape as `CreateWordInput`)

```json
{
  "term": "ephemeral",
  "part_of_speech": "adjective",
  "definition": "lasting a very short time",
  "synonyms": ["fleeting", "transient"],
  "example_sentence": "The ephemeral beauty of cherry blossoms draws crowds each spring."
}
```

**Errors:**

- `400` — empty or invalid term
- `502` — LLM returned unparseable JSON after retry
- `503` — Ollama unreachable

### `POST /api/words/{id}/review`

**Body:**

```json
{ "knew_it": true }
```

Returns the updated `Word` after applying SRS rules.

## SRS rules (backend)

- `knew_it: false` → `status = learning`, `interval_days = 0`, `next_review_at = now + 10 minutes`, `repetitions = 0`
- `knew_it: true` on new/learning → `repetitions += 1`, intervals `[1, 3, 7, 14, 30]` days by repetition count
- `knew_it: true` on review → multiply interval by `ease_factor` (min `1.3`), cap at `90` days
- Mastered when `interval_days >= 30` and `repetitions >= 4`

Frontend mirrors these rules in [`../srs/srs.ts`](../srs/srs.ts). Shared constants for backend parity live in [`../srs/constants.ts`](../srs/constants.ts).

## Dev setup

- Vite proxies `/api` → `http://localhost:8000`
- Override base URL with `VITE_API_BASE_URL` if needed
- **Fill with AI** requires Ollama at `http://localhost:11434` (configure via `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in `backend/.env`)
