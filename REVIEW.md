# Code Review Findings

Full codebase review — vocab_cards. Generated 2026-06-17.

---

## What's Working Well

- Clean router → schema → repository → service layering; dependency direction is consistently one-directional
- Repository Protocol interfaces are genuine abstractions — concrete SQLAlchemy implementations wired in one place each
- Per-user data isolation: `SqlAlchemyWordRepository` receives `user_id` at construction time, every query filters on it
- `api/http.ts` is the single fetch wrapper — token injection, 401 interception, and response parsing centralized
- SRS logic is pure and cross-stack verified: `srs.py` and `srs.ts` exercise identical scenarios with precise value assertions
- Tests serve as specifications — prose-level names, behavior-based assertions, no implementation leakage
- No god files — every file under 200 lines
- CLAUDE.md is thorough and actionable
- Commit discipline is strong: bracketed type prefixes, tests committed alongside features, refactors explicitly separated
- Named constants replace all magic numbers across both stacks

---

## Hotspots

Files with high change frequency + meaningful complexity — fixes here have the most leverage.

| Rank | File | Changes | Notes |
|------|------|---------|-------|
| 1 | `frontend/src/components/WordForm/WordForm.tsx` | 3 | Two async flows, 5 state vars, 163 lines |
| 2 | `frontend/src/hooks/useStudySession.ts` | 4 | 5 useState, async fetch, 2 queue-mutation callbacks |
| 3 | `backend/app/routers/words.py` | 3 | 5 handlers, mixed auth visibility, SRS logic in router |
| 4 | `backend/app/main.py` | 4 | Central wiring point, touched on every new router |
| 5 | `backend/app/config.py` | 4 | Moves in lockstep with `main.py` and `.env.example` |
| 6 | `frontend/src/api/wordsApi.test.ts` | 4 | Manual fetch stubbing, fragile to `http.ts` refactors |
| 7 | `backend/tests/conftest.py` | 3 | Mirrors `main.py` wiring, grows with every new router |

---

## Temporal Coupling

File pairs that move together across commits — implicit contracts not reflected in imports.

- `backend/app/config.py` + `backend/app/main.py` + `backend/.env.example` — move as a triple in every relevant commit
- `backend/tests/conftest.py` + `backend/app/main.py` — co-occur in 3 commits; conftest mirrors main's DI wiring
- `frontend/src/components/WordForm/WordForm.tsx` + `frontend/src/pages/AddWordsPage.tsx` — 3 commits; prop interface still stabilizing
- `frontend/src/components/WordForm/WordForm.tsx` + `frontend/src/pages/AddWordsPage.test.tsx` — 3 commits; suggests page test is testing component internals
- `backend/app/routers/words.py` + `frontend/src/api/wordsApi.ts` — 2 commits; expected API contract seam

---

## Fix Checklist

### Critical

- [ ] **N+1 query + layer violation in `sqlalchemy_user_repository.py:59–80`**
  `list_all_with_stats` imports `is_due` from `services/srs` (upward layer violation) and fires one `SELECT words` per user (N+1). Fix: move `due_count` computation into `admin.py` as a SQL `COUNT(CASE WHEN ...)` aggregate. Repositories should not call services.
  Effort: S

- [ ] **Auth guard on `GET /api/words` is invisible — `routers/words.py:22–24`**
  Auth is enforced indirectly via `get_word_repository` but not declared at the route. `enrich_word` already uses `_: User = Depends(get_current_user)` as the pattern — add the same to `list_words` and `review_word`.
  Effort: XS | Hotspot file — high leverage

### Suggestions

- [ ] **Push `list_due_words` filtering to SQL — `routers/words.py:32–36`**
  Fetches all words into memory on every study session start, then filters in Python. Add `list_due(limit, now)` to `WordRepository` protocol with `WHERE next_review_at <= now OR next_review_at IS NULL`.
  Effort: S | Hotspot file, hot path

- [ ] **Fix `seed.py` to go through the repository abstraction — `db/seed.py:17–24`**
  `seed_admin_user` mutates `row.role` directly on the ORM model, bypassing `UserRepository`. Add `promote_to_admin(user_id)` to the protocol and implementation; update the seeder.
  Effort: S

- [ ] **Switch `wordsApi.test.ts` from `fetch` stub to MSW — `api/wordsApi.test.ts:10–38`**
  Stubs `global.fetch` and asserts on raw header inspection. Every other frontend test uses MSW. Breaks on any `http.ts` refactor even when HTTP behavior is unchanged.
  Effort: S | Hotspot file

- [ ] **Extract `useAdminUsers` hook from `AdminPage` — `pages/AdminPage.tsx:20–53`**
  `AdminPage` has an inline `useEffect + useState + isActive` fetch sequence. Every other page delegates to a hook (`useStudySession`, `useAddWord`, `useAuth`). Extract `useAdminUsers` to restore consistency.
  Effort: S

- [ ] **Add `formPost` helper in `http.ts`; use it from `authApi.login` — `api/authApi.ts:19–25`**
  `login` calls `fetch` directly — the only place in the frontend outside the HTTP fence. A `formPost(path, body)` in `http.ts` that skips token injection but keeps the 401 hook would unify the pattern.
  Effort: XS

- [ ] **Eliminate double `GET /api/auth/me` on login — `auth/AuthProvider.tsx:72–76`**
  `login` calls `loginRequest` then `getMe()`. Extend `POST /api/auth/login` to return the `User` alongside `access_token`, then remove the second `getMe()` call in `AuthProvider`.
  Effort: XS (backend + frontend)

- [ ] **Fix `authenticate` to reuse `find_by_email` — `sqlalchemy_user_repository.py:51–57`**
  `authenticate` duplicates the `SELECT WHERE lower(email) = lower(?)` query that `find_by_email` already performs. Call `find_by_email` first, then verify the password.
  Effort: XS

- [ ] **Remove dead second existence check in `review_word` — `routers/words.py:60–76`**
  Word is fetched via `find_by_id`, then `apply_srs_update` checks existence again. The second 404 branch cannot fire in normal operation. A combined get-and-update in the repository suffices.
  Effort: XS

- [ ] **Decouple `navigation.ts` from API `User` type — `components/Layout/navigation.ts:1`**
  `navigation.ts` imports `User` from `api/authTypes` to check `user.role`. Accept `{ role: string } | null` instead to break the dependency on the API response shape.
  Effort: XS

- [ ] **Add JWT secret startup warning — `backend/app/config.py:13`**
  `jwt_secret` defaults to `"dev-only-change-me"` with no warning. Add a `@field_validator` or `on_startup` log warning when the value matches the default.
  Effort: XS

- [ ] **Rename `init_db()` to `verify_db_connection()` — `backend/app/db/session.py:29–31`**
  The function is a no-op but is called on startup, misleading readers into thinking it initializes the schema. Rename and actually ping the DB, or remove it and add a comment pointing to Alembic.
  Effort: XS

- [ ] **Rename `WordFormField` type to `WordFormFieldKey` — `components/WordForm/validateWordForm.ts:10`**
  The type alias `WordFormField` collides with the `WordFormField` React component in the same directory. Resolution requires tracking import paths. `WordFormFieldKey` eliminates the ambiguity.
  Effort: XS

### Missing Tests

- [ ] **Auth validation boundaries — `tests/test_auth_api.py`**
  `POST /api/auth/register` with password `< 8 chars` or malformed email should return 422. No test covers these schema validation paths.
  Effort: XS

- [ ] **Cross-user review authorization — `tests/test_words_api.py`**
  No test verifies that user B cannot review user A's word using its ID (`POST /api/words/{A_word_id}/review` as user B should return 404).
  Effort: XS

- [ ] **SRS boundary conditions — `tests/test_srs.py` + `srs/srs.test.ts`**
  Neither suite covers the `MAX_INTERVAL_DAYS` (90-day) cap or the `MIN_EASE_FACTOR` (1.3) floor. Add one test case each that exercises the clamping guard.
  Effort: XS

- [ ] **`LoginPage` error path — `pages/LoginPage.test.tsx`**
  Only the happy path is tested. The error `<p className="auth-form__error">` is rendered on 401 but never exercised by a test.
  Effort: XS

- [ ] **`AdminPage` error path and empty state — `pages/AdminPage.test.tsx`**
  Only the happy path (admin sees a table) is tested. Add tests for API error response and empty user list.
  Effort: XS

- [ ] **Fix `test_words_are_isolated_between_users` to use overridden client — `tests/test_words_api.py:105–127`**
  `other_client` is created with raw `TestClient(app)` without dependency overrides, so it connects to a different session than the fixture client. Both clients should use the same overridden in-memory DB.
  Effort: S

### Nitpicks

- [ ] Extract `_as_utc(dt)` helper in `backend/app/services/srs.py:85–98` — both `is_due` and `_urgency_rank` independently guard against naive datetimes with the same `replace(tzinfo=UTC)` block. XS
- [ ] Centralise `term.strip()` normalisation in a Pydantic `@field_validator` on `CreateWordInput.term` — currently stripped in both the router (`routers/words.py:44`) and the repository (`sqlalchemy_word_repository.py:43`). XS
- [ ] Add inline comment on `enrich_word`'s `_: User = Depends(get_current_user)` explaining it's an auth-only guard (`# auth guard — enrichment is user-agnostic`). XS
- [ ] `parseSynonymsInput` returns `string[] | undefined` on empty rather than `[]`, inconsistent with backend's `Field(default_factory=list)`. Return `string[]` always. XS
- [ ] Add a barrel `frontend/src/srs/index.ts` re-exporting the public surface so callers have a single stable import target. XS
- [ ] Add a commented-out example handler in `frontend/src/test/handlers.ts` to make the MSW pattern discoverable. XS
- [ ] `frontend/src/App.tsx` uses a default export; every other component in the codebase uses named exports. XS
- [ ] Remove extraneous `Layout` wrapper and unneeded auth mock from `StudyPage.test.tsx:76–92` — the test only asserts on an `href`. XS

---

## Larger Investments (plan as stories)

- [ ] **Audit and resolve the frontend `srs/` module**
  Three agents flagged this as likely dead code — no production path calls `computeNextReview` or `isDue` from TypeScript; only `srs.test.ts` consumes these exports. Either wire into an optimistic update path and document the intent, or delete the module and eliminate the dual-maintenance burden.
  Effort: S–M

- [ ] **Extract `WordService` in the backend**
  `words.py` router directly calls SRS functions (`is_due`, `sort_by_urgency`, `compute_next_review`). Extract a `WordService` with `get_due_words(repo, limit, now)` and `process_review(repo, word_id, knew_it, now)` so the router becomes a thin HTTP adapter. `words.py` is a hotspot — reducing its responsibility lowers future change friction.
  Effort: M

- [ ] **Establish a branch-and-PR workflow**
  All 44 commits landed directly on `main` with no review gate. Security-sensitive commits (JWT, admin credentials) went to main without a diff artifact. Even a self-review PR creates a traceable record and enables future reviewers to understand intent.
  Effort: M (process change)

- [ ] **Adopt commit body convention ("Why:" line)**
  0 of 44 commits include a body explaining motivation. Non-trivial commits (new dependencies, threshold values, architectural choices) should include a one-sentence body. Add a pre-commit hook or team norm.
  Effort: quick habit change

---

## Not Worth Prioritizing Now

- `_urgency_rank`/`is_due` timezone duplication — tiny, stable file, zero production risk
- `parseSynonymsInput` returning `undefined` vs `[]` — works correctly today
- `srs/` barrel `index.ts` — minor discoverability improvement
- `App.tsx` default export — cosmetic inconsistency
- `[EWF]` undefined commit tag in history — historical, no current impact
- `config.py`/`main.py`/`.env.example` triple coupling — tech debt in stable config code, low urgency
