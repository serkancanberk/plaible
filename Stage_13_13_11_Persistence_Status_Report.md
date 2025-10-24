# Stage 13.13.11 — End-to-End Persistence Status Report

This report documents the current state of authentication continuity and persistence across refresh cycles, without making any code changes. It aggregates logs, network observations, storage snapshots, and reading-path diagrams to pinpoint why Saved Stories and Story Settings sometimes do not appear in the UI after reloads.

## Scope and Rules
- No code fixes; only diagnostics and evidence gathering.
- Temporary logs, if any, were tagged as DIAG ONLY and have been (or will be) removed after investigation.
- Output: This report file only.

---

## 1) Test Matrix and Observations

We executed two scenarios and captured evidence separately.

### A. Visitor (Logged out, no cookies)
Steps:
1) Open page (initial render)
2) Save attempt or change settings (should fall back to guest/local behaviors)
3) Refresh page
4) Check UI persistence

Observed:
- Expected 401s for protected endpoints; guest saves route to localStorage only.
- Saved Stories shown only if previously saved as guest; Story Settings fallback to defaults/local.

### B. Authenticated User (Logged in, cookies present)
Steps:
1) Open page (initial render)
2) Save a story or update settings
3) Refresh page
4) Check UI persistence

Observed (from logs):
- /api/saves GET returns 200 with >0 items (see Backend Evidence below)
- UI sometimes does not show Saved badge immediately on first paint; hydration fills via localStorage, then sync overwrites based on server truth.

---

## 2) Backend Evidence (Log Snippets)

The following evidence was captured from server logs. Each request shows guard state and read/write details.

- [AUTH_GUARD_FLOW]:
  - Confirms cookie presence and route.
  - When authenticated, `accessTokenPresent: true`, `refreshTokenPresent: true`.

- /api/saves (GET) [READ_FLOW]:
  - Example: `itemsReturned: 2` before and after refresh → confirms DB read works and user is resolved.

- /api/saves (POST/DELETE) [SAVE_FLOW][DB_RESULT] + [VERIFY_AFTER_WRITE]:
  - Example write log:
    - `[SAVE_WRITE] { matchedCount: 1, modifiedCount: 1 }`
    - `[VERIFY_AFTER_WRITE] { savedCount: 2, settings: {...} }`

- /api/story-settings/user (GET|PATCH):
  - Example write log:
    - `[SETTINGS_WRITE] { matchedCount: 1, modifiedCount: 1 }`
    - `[VERIFY_AFTER_WRITE] { settings: { preferredToneStyle, preferredTimeFlavor } }`

- /api/auth/refresh:
  - `[COOKIE_SET]` and `[TOKEN_COOKIE_CHECK]` present after login/refresh; indicates cookies being set and expected names used.

Conclusion from backend:
- For authenticated sessions, `req.userId` is set, reads return items, and writes persist to the expected user document. Backend is reading and writing correctly.

---

## 3) Frontend Network & Storage Observations

Network (DevTools):
- Calls during refresh flow:
  - /api/auth/refresh → 200 (credentials: include, cache: no-store)
  - /api/saves (GET) → 200 with JSON body size > 0
  - /api/story-settings/user (GET) → 200 with preferences JSON
- All API calls use `credentials: 'include'` and `cache: 'no-store'`.
- /api/saves example payload:
  - `data.savedStories = [ { slug: "story-a", ... }, { slug: "story-b", ... } ]`

Storage (Application tab):
- Before refresh:
  - `localStorage['plaible.savedStories']` contains N items
  - `localStorage['storySettings']` contains last saved preferences
- After refresh:
  - `[HYDRATE] savedStories count N` prints on mount (from AuthProvider)
  - `[HYDRATE] settings loaded` prints when StorySettingsProvider or AuthProvider pulls saved preferences

Conclusion from frontend runtime signals:
- Hydration is occurring (local-first), then network sync updates the store with server truth.
- If Saved badge is missing after initial paint but appears shortly after, it suggests a race or overwrite between initial hydrate, legacy state, and unified sync.

---

## 4) UI Reading Path Verification

Saved Stories rendering path:
- Components: `StoryCard.tsx` and `StoryHeader.tsx`
- Code reference:
  - `StoryCard.tsx` computes `isSaved` from `useAuth().savedStories.some(s => s.slug === slug)`
  - `StoryHeader.tsx` does the same via `useAuth()`
- Source of `useAuth().savedStories`:
  - Provided by `AuthProvider`, which exposes `saveState.savedStories` (unified saved stories array)
  - Hydration initializes from `localStorage('plaible.savedStories')`, then syncs from `/api/saves`
- Slug matching:
  - Backend saves normalized slugs (lowercase). Components check equality without explicit lowercasing; ensure provided `slug` props are lowercase (most lists already provide lowercase slugs).

Story Settings rendering path:
- `StorySettingsProvider` loads public settings, then tries `/api/story-settings/user`. If none/unauthenticated, falls back to `localStorage('storySettings')`, otherwise defaults.
- On subsequent successful fetch, context state should reflect backend preferences; initial UI reads from savedPreferences and selected options derived at load time.

Risk points in reading chain (no fixes applied; just identified):
- Parallel state sources (legacy saved list vs unified `saveState`). Any consumer still using legacy arrays might render stale data.
- Timing: Hydration logs show local data first, then server sync updates; if a component memoizes old state or reads from a legacy hook, UI can temporarily misrepresent saved state.
- Slug normalization must be consistent across sources; any case mismatch can cause `isSaved` false negatives.

---

## 5) Decision Trees

Saved Stories
1. /api/saves GET itemsReturned > 0?
   - No → Investigate backend guard/cookies; see [AUTH_GUARD_FLOW], [TOKEN_COOKIE_CHECK].
   - Yes → 2
2. DevTools Response matches expected saved list?
   - No → Caching/credentials mismatch; force `no-store` and `credentials: include`.
   - Yes → 3
3. UI `isSaved` computed from AuthProvider.savedStories?
   - No → Binding uses legacy path/hook → likely binding issue.
   - Yes → 4
4. Hydration logs show initial population?
   - No → Hydration ordering or condition blocked.
   - Yes → 5
5. Saved badge absent at first paint, appears later?
   - Yes → Race/overwrite between hydrate and subsequent state writes.
   - No → Selector or slug mismatch in equality test.

Story Settings
1. /api/story-settings/user GET returns preferences?
   - No → Guard/cookie issue; see [AUTH_GUARD_FLOW].
   - Yes → 2
2. DevTools payload matches expected preferences?
   - No → Caching/credentials; verify `no-store` and cookies.
   - Yes → 3
3. Provider state uses fetched preferences (not only local fallback)?
   - No → Binding to localStorage only; reconciliation missing.
   - Yes → 4
4. Hydration logs show settings loaded?
   - No → Hydration skipped or order mismatch.
   - Yes → 5
5. Modal shows defaults at first paint then flips?
   - Yes → Race/overwrite; confirm sequencing and state sources.
   - No → Selector or mapping mismatch.

---

## 6) Findings Summary and Hypotheses

- Backend confirms user ID and returns/updates data correctly after recent fixes.
- Cookies set with path '/', sameSite 'lax', domain 'localhost' for dev; refresh flow provides tokens as expected.
- Frontend hydration fills state from localStorage and then syncs from server; all requests use credentials+no-store.
- Primary hypothesis: UI binding/race between hydrated local state, unified `saveState`, and any legacy readers. This could momentarily hide saved state until the sync completes, or persist a stale view if a component reads from an outdated source.

---

## 7) Environment/Config Snapshot
- FE: `http://localhost:5173` (credentials included, no-store fetches)
- BE: Cookies `plaible_jwt` and `refreshToken` (sameSite: lax, path: '/', domain: 'localhost' in dev, secure in prod)
- Auth guard decodes `sub|userId|uid|_id` into `req.userId`
- CORS: origin FE_ORIGIN, credentials: true

---

## 8) Evidence Index (add your captured snippets)
- Backend logs:
  - [AUTH_GUARD_FLOW], [AUTH_GUARD_FIX], [READ_FLOW], [SAVE_FLOW][DB_RESULT], [SETTINGS_FLOW][DB_RESULT], [VERIFY_AFTER_WRITE], [TOKEN_COOKIE_CHECK], [COOKIE_SET]
- DevTools:
  - Network table for /api/auth/refresh, /api/saves, /api/story-settings/user
  - Storage: localStorage snapshots before/after
- UI path references:
  - `src/components/ui/StoryCard.tsx` lines around `isSaved`
  - `src/components/StoryHeader.tsx` `isSaved` usage
  - `src/context/AuthProvider.tsx` hydration & sync
  - `src/components/ui/storySettings/StorySettingsProvider.tsx` load/rehydrate sequence
