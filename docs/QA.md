# QA Smoke Checklist — Plaible Backend

This checklist verifies the core backend flows quickly on a fresh local dev environment.

> **Prereqs**
> - Server running at `http://localhost:5050` (`node server.js`)
> - Seeded story (optional): `npm run seed:story`
> - Google OAuth configured (.env filled) or dev fallback enabled for protected routes

---

## 1) Health

```bash
curl -s http://localhost:5050/api/health
# Expect: {"ok":true,"env":"development"|"production"}
```

## 2) Public browsing (no cookie required)

```bash
# Stories list (cards)
curl -s http://localhost:5050/api/stories

# Story detail
curl -s http://localhost:5050/api/stories/the-picture-of-dorian-gray

# Public feedback feed (paginated)
curl -s "http://localhost:5050/api/feedbacks/story/the-picture-of-dorian-gray?limit=2"
```

## 3) Auth (Google OAuth, stateless JWT cookie)

```bash
Browser
	1.	Open http://localhost:5050/api/auth/google (use ?force=1 if consent needs to show). # (macOS only)
	2.	After login, cookie plaible_jwt should be set.
```

Verify

```bash
# Who am I (needs cookie in browser; or copy cookie to curl)
open http://localhost:5050/api/auth/me # (macOS only)
```

```bash
# Ping (works without cookie, but userId is null unless logged in)
curl -s http://localhost:5050/api/auth/ping
```

Logout

```bash
open http://localhost:5050/api/auth/logout # (macOS only)
```

## 4) Wallet

Do this after successful login (cookie present in the browser).
With curl, pass cookies or use browser Console examples below.

```bash
# Top up 100 credits
curl -s -X POST http://localhost:5050/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"provider":"dev"}'

# Check balance
curl -s http://localhost:5050/api/wallet/me
```

Browser Console (alternative)

```js
await fetch('/api/wallet/topup', { method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ amount: 100, provider: 'dev' }) }).then(r=>r.json());
await fetch('/api/wallet/me').then(r=>r.json());
```

## 5) Sessions

```bash
# Start a session (deduct credits for chapter 1)
curl -s -X POST http://localhost:5050/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"storySlug":"the-picture-of-dorian-gray","characterId":"chr_dorian"}'
```

Browser Console (advance & complete)

```js
const active = await fetch('/api/sessions/active').then(r=>r.json());
const sid = active.sessionId;

// Make a choice and advance a chapter (deducts credits)
await fetch(`/api/sessions/${sid}/choice`, {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ chosen:'explore', freeText:'Look behind the curtain.', advanceChapter:true })
}).then(r=>r.json());

// Complete (+optional rating)
await fetch(`/api/sessions/${sid}/complete`, {
  method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ stars:5, text:'Loved the arc.' })
}).then(r=>r.json());
```

## 6) Feedbacks

```bash
# Upsert my review for the story (requires auth)
curl -s -X POST http://localhost:5050/api/feedbacks \
  -H "Content-Type: application/json" \
  -d '{"storySlug":"the-picture-of-dorian-gray","stars":5,"text":"Short, tight, loved it."}'

# Public list
curl -s "http://localhost:5050/api/feedbacks/story/the-picture-of-dorian-gray?limit=2"
```

### Validation checks

- text > 250 chars → 400
- stars ∉ [1..5] → 400
- Posting twice with same user overwrites (no dup)

---

## 7) Saves (Bookmarks) & Shelf

```bash
# Save
curl -s -X POST http://localhost:5050/api/saves \
  -H "Content-Type: application/json" \
  -d '{"storySlug":"the-picture-of-dorian-gray"}'

# List saves
curl -s "http://localhost:5050/api/saves?limit=10"

# Combined shelf (recent active sessions + saved)
curl -s "http://localhost:5050/api/saves/shelf?recentLimit=5&savedLimit=5"

# Unsave
curl -s -X DELETE http://localhost:5050/api/saves/the-picture-of-dorian-gray
```

### Idempotency

- POST returns { ok:true, created:true|false }
- DELETE returns { ok:true, deleted:true|false }

---

## 8) Common errors to verify

- 401 UNAUTHENTICATED on protected routes without cookie
- 402 INSUFFICIENT_CREDITS when starting/advancing without enough balance
- 400 BAD_REQUEST on invalid payloads (sessions input, feedback stars/text)
- 404 NOT_FOUND for invalid session IDs or missing records

---

## 9) Troubleshooting

- OAuth not redirecting:
- Check .env → GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- Verify Google Console → Authorized redirect URI matches .../api/auth/google/callback
- Cookie issues:
- Dev: secure=false, sameSite:lax; Prod: set secure=true with HTTPS
- Public routes:
- GET /api/stories, GET /api/stories/:slug, GET /api/feedbacks/story/:slug are public by design

---

## `/api/dev/events` (Developer Debug Endpoint)

This endpoint provides access to raw event logs for debugging and development.

**Filters & Parameters:**

- **userId**
  - `userId=me` → Returns events for the current authenticated user
  - `userId=<ObjectId>` → Returns events for the specified user
  - *If no `userId` is provided → Returns all events (default)*

- **type**
  - `type=a,b,c` → Filters by comma-separated event types  
  - Examples: `type=achievement.unlocked,wallet.topup`

- **cursor**
  - `cursor=<ISO Date>` → Time-based pagination (returns events with `createdAt < cursor`)  
  - Must be a valid ISO date string; invalid values return `400 { error: "BAD_REQUEST", field: "cursor" }`

- **limit**
  - Default: `20`
  - Maximum: `100`

**Response Format:**
```json
{
  "ok": true,
  "items": [ ... ],
  "nextCursor": "2025-09-06T18:15:30.269Z",
  "hasMore": true
}
```

**Examples:**
- Latest 5 events (all users):
  ```
  GET /api/dev/events?limit=5
  ```
- Latest 5 for current user only:
  ```
  GET /api/dev/events?userId=me&limit=5
  ```
- Filter by event types:
  ```
  GET /api/dev/events?type=achievement.unlocked,wallet.topup&limit=5
  ```
- Cursor pagination:
  ```
  GET /api/dev/events?limit=3
  GET /api/dev/events?limit=3&cursor=<nextCursor from previous page>
  ```

---

Last updated: {{today}}
