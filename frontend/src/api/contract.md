# API contract

The frontend expects a FastAPI backend implementing these endpoints. Types are defined in [`types.ts`](./types.ts).

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

Returns all words.

### `GET /api/words/due?limit=20`

Returns words where `next_review_at` is `null` or `<= now`, ordered by urgency.

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
