# Stage 13.13.12 — Unified State Race Diagnosis & Refactor Plan

Goal: Analyze and resolve UI persistence races across AuthProvider, StorySettingsProvider, and useAuth consumers (e.g., `StoryCard.tsx`, `StoryHeader.tsx`) so that, after refresh, backend truth is consistently reflected and not lost between localStorage hydration and in-memory state.

Note: This document proposes a diagnosis and refactor plan only. No code changes are included here.

---

## 1) Hydration Timeline Trace (AuthProvider)

Current intended timeline (simplified):
1. Mount → Hydrate `saveState.savedStories` from localStorage
2. Attempt `refreshAuth()` → then `fetchUser()`
3. If authenticated → `syncSavedStories()` (server truth)
4. Parallel diagnostics/aux flows: retry pending changes, periodic refresh

Suggested instrumentation (diagnostic logs):
- [REFRESH_AUTH] start/end, status
- [FETCH_USER] start/end, status
- [HYDRATE] savedStories count (already present)
- [SYNC] savedStories (pre/post lengths)
- [SET_SAVE_STATE] when `setSaveState` runs, log caller context: `hydrate | sync | optimistic | rollback`

Target of trace: Identify if/when `setSaveState({ savedStories: [] })` overwrites hydrated or synced state (e.g., legacy clear, cleanup effects, or guest/visibility-change handlers).

Observed sources of overwrite risk:
- Cleanup/visibility effects clearing lists can race with post-refresh fetch.
- Legacy `savedStories` string list vs unified `saveState.savedStories` array; ensure all consumers use the unified source.

---

## 2) StorySettingsProvider Sync Order

Current intended sequence:
1. Load public settings
2. Try `/api/story-settings/user` (server truth)
3. If unavailable, hydrate from `localStorage('storySettings')`
4. Else fallback to defaults

Diagnostics to add:
- [SETTINGS_SYNC] when server preferences are applied
- [SETTINGS_HYDRATE] when localStorage preferences are used

Risk: If StorySettingsProvider mounts before AuthProvider has refreshed tokens/user, server GET can 401 and fallback to local, then later server success may or may not reconcile. This can present a brief reset/flip in UI.

Mitigation (see barriers below): Delay first server fetch until AuthProvider confirms `hydrated === true`.

---

## 3) useAuth Consumers Race Check

Components reviewed:
- `src/components/ui/StoryCard.tsx` → `isSaved = savedStories.some(s => s.slug === slug)`
- `src/components/StoryHeader.tsx` → same logic

Diagnostics to add temporarily:
- `[RENDER] StoryCard` log with `{ slug, isSaved, savedCount: savedStories.length }`
- Compare render order against `[HYDRATE]` and `[SYNC]` logs.

Interpretation:
- If initial render logs `savedCount: 0` and later re-render updates it, the binding is correct but hydration arrives post-first-paint. If it stays 0 while `/api/saves` shows items, then a binding/source issue exists.

Slug consistency:
- Ensure incoming props `.slug` are lowercase to match backend stored slugs (already normalized). If mismatched, `isSaved` may be a false negative.

---

## 4) State Source Isolation (Single Source of Truth)

AuthProvider:
- Principle: `saveState.savedStories` is the single source.
- Sequence:
  - Hydrate once from localStorage (guard with `hydratedOnceRef.current`)
  - Only backend sync should update the authoritative list thereafter
  - Avoid other effects writing `savedStories = []` (cleanup/visibility) before sync completes; gate clears until after sync or user switch
- Optimistic save toggles should only adjust local list while also tracking `pendingChanges` and later reconciling with backend response

StorySettingsProvider:
- Prefer “server-first merge”: if server prefs arrive, they override local; otherwise, hydrate from localStorage.
- Guard double-application with a `settingsHydratedOnceRef` similar to Auth.

---

## 5) Cross-Provider Sync Barrier (Auth-first)

Introduce an Auth hydration barrier:
- Add `hydrated: boolean` flag to Auth context
- Auth sets `hydrated = true` after `refreshAuth()` + `fetchUser()` complete and initial `syncSavedStories()` has settled (or timed out)
- StorySettingsProvider defers its initial server fetch until `hydrated === true`

Benefits:
- Avoids StorySettings fetching with a 401 and falling back to local unnecessarily
- Reduces flip-flop between local and server states

---

## 6) UI Reconciliation Layer

AuthProvider:
- Change `useEffect(() => syncSavedStories(), [user])` to wait for both `hydratedOnceRef.current === true` and `user != null`
- Ensure visibility/cleanup handlers do not clear lists while a sync is in-flight

Story components (e.g., `StoryCard`):
- Optionally guard first paint when `hydrating === true` to avoid visual flicker: `if (hydrating) return null;` (diagnostic/UX choice)

---

## 7) Sync Dependency Graph

Text diagram:

[localStorage] → (AuthProvider hydrate once) → [saveState.savedStories]
                                      └→ (after refreshAuth + fetchUser) → syncSavedStories() → [saveState.savedStories]

[Auth.hydrated === true] → StorySettingsProvider initial server fetch
localStorage('storySettings') → fallback apply only if server unavailable

Consumers (StoryCard/StoryHeader) → read from AuthProvider.saveState.savedStories

---

## 8) Detected Race Points & Overwrites (Likely)

- Early cleanup/visibility effects clearing lists before server sync finishes
- StorySettingsProvider fetching before Auth refresh, causing a fallback to local, then overwriting with server later
- Legacy `savedStories` string array in context coexisting with unified `saveState.savedStories` (ensure all UI reads use unified source)

Evidence alignment:
- Backend logs show itemsReturned > 0
- Hydration logs show local saved count
- If UI still renders as unsaved at first paint, timing/ordering is the likely cause

---

## 9) Minimal Refactor Steps (Plan)

1) Auth hydration guard
- Add `hydratedOnceRef` to ensure hydrate runs once and before any clearing
- Add `hydrated` boolean to Auth context, set true after: `refreshAuth()` → `fetchUser()` → first `syncSavedStories()` attempt

2) StorySettings server-first and barrier
- Defer StorySettingsProvider server fetch until `Auth.hydrated === true`
- Log `[SETTINGS_SYNC]` and `[SETTINGS_HYDRATE]` to validate flow

3) Single source of truth enforcement
- Remove/stop exposing legacy `savedStories` string list from context
- Ensure all consumers use `saveState.savedStories`

4) Defensive clears
- Gate cleanup/visibility-change clears to not run while `hydrating === true` or until after first sync response

5) Optional UX smoothing
- For components sensitive to flicker, render null/loading while `hydrating === true`

---

## 10) Suggested Validation Logs & Metrics

- AuthProvider:
  - [HYDRATE] savedStories count (before first paint)
  - [REFRESH_AUTH] status
  - [FETCH_USER] status
  - [SYNC] savedStories: oldCount → newCount
  - [AUTH_HYDRATED] true when barrier opens

- StorySettingsProvider:
  - [SETTINGS_HYDRATE] used local
  - [SETTINGS_SYNC] used server

- Components:
  - [RENDER] StoryCard { slug, isSaved, savedCount }

Success criteria:
- After refresh, `[HYDRATE] savedStories count > 0` and `/api/saves` `[READ_FLOW] itemsReturned > 0`
- StoryCard render shows `isSaved: true` for saved slugs without flicker or overwrite
- Story Settings modal shows saved preferences immediately and remains stable

---

## 11) Next Steps

- Implement barrier flag and hydration guards (small, localized changes)
- Remove or deprecate legacy saved list exposures
- Add/keep diagnostics until stable across several refresh cycles, then remove DIAG logs
