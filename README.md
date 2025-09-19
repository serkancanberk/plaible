Plaible — Backend

Express + MongoDB backend for interactive, credit-based classic stories.

Table of Contents
	•	Quickstart
	•	Environment
	•	Run Locally
	•	Authentication
	•	Public Browsing (Unauthenticated)
	•	Feature Endpoints
	•	Testing (curl / browser)
	•	Dev Toggles & Tips
	•	Docs
	•	Troubleshooting

Quickstart
	1.	Clone & install

git clone git@github.com:serkancanberk/plaible.git
cd plaible
npm install

	2.	Environment

	•	Copy .env.example → .env and fill placeholders:
	•	MONGODB_URI (local: mongodb://127.0.0.1:27017/plaible)
	•	JWT_SECRET (use a long random string)
	•	Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
(local: http://localhost:5050/api/auth/google/callback)
	•	Optional: FE_ORIGIN=http://localhost:5050 (switch to http://localhost:5173 when FE is running)

	3.	Seed sample data (optional)

npm run seed:story     # seeds "The Picture of Dorian Gray"
npm run seed:user      # creates a test user (dev flow only)

	4.	Run the server

node server.js
# Server -> http://localhost:5050

Environment

A template is provided in .env.example. Required keys:
	•	Core: NODE_ENV, PORT, FE_ORIGIN, MONGODB_URI, JWT_SECRET
	•	Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, GOOGLE_FORCE_CONSENT
	•	Dev flags: DEV_FAKE_USER, AUTH_DEBUG
	•	Optional: OPENAI_*, STRIPE_SECRET_KEY, IYZICO_*, DEFAULT_LANGUAGE

Note: .env is git-ignored by default.

Run Locally

node server.js

	•	Health: GET /api/health → { ok: true, env }
	•	Root: GET / → “Plaible API is running…”

Authentication

Google OAuth (stateless JWT cookie):
	•	Start: GET /api/auth/google (append ?force=1 to always show consent if GOOGLE_FORCE_CONSENT=false)
	•	Callback: GET /api/auth/google/callback (sets plaible_jwt cookie)
	•	Who am I: GET /api/auth/me (requires cookie)
	•	Logout: POST /api/auth/logout (also GET /api/auth/logout in dev)
	•	Ping: GET /api/auth/ping

Dev fallback (optional):
Set NODE_ENV=development and DEV_FAKE_USER=1 to auto-inject a fixed userId for protected routes.

Public Browsing (Unauthenticated)

These endpoints are intentionally public for landing / marketing pages:
	•	GET /api/stories — list stories (cards)
	•	GET /api/stories/:slug — story detail (full metadata)
	•	GET /api/feedbacks/story/:slug?limit=&cursor= — public reviews feed

Feature Endpoints

All below require auth (cookie) unless stated otherwise:
	•	Stories: GET /api/stories, GET /api/stories/:slug (public)
	•	Sessions:
	•	POST /api/sessions/start — start (deduct credits, one active per story)
	•	GET /api/sessions/active — latest active session (optional ?storySlug=)
	•	GET /api/sessions — list (status filter, cursor pagination)
	•	POST /api/sessions/:id/choice — append choice / advance (deduct)
	•	POST /api/sessions/:id/complete — mark completed (+optional rating)
	•	GET /api/sessions/:id — fetch one (owner only)
	•	Wallet:
	•	GET /api/wallet/me — balance
	•	GET /api/wallet/transactions?limit=&cursor= — history
	•	POST /api/wallet/topup — add credits (dev/sim)
	•	POST /api/wallet/deduct — deduct credits
	•	POST /api/wallet/refund — refund
	•	Feedbacks:
	•	POST /api/feedbacks — upsert user’s review
	•	GET /api/feedbacks/story/:slug — public list (public)
	•	Saves (Bookmarks):
	•	POST /api/saves — save (idempotent)
	•	DELETE /api/saves/:slug — unsave (idempotent)
	•	GET /api/saves — list bookmarks
	•	GET /api/saves/shelf — combined recent (active sessions) + saved (bookmarks)
	•	GET /api/saves/story/:slug/is-saved — boolean for current user

Testing (curl / browser)

Public (no cookie):

curl http://localhost:5050/api/stories
curl "http://localhost:5050/api/feedbacks/story/the-picture-of-dorian-gray?limit=2"

Login (browser):
	•	Open http://localhost:5050/api/auth/google → consent → redirected
	•	Check: http://localhost:5050/api/auth/me

Wallet (after login):

curl -X POST http://localhost:5050/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"provider":"dev"}'
curl http://localhost:5050/api/wallet/me

Session start (after login):

curl -X POST http://localhost:5050/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"storySlug":"the-picture-of-dorian-gray","characterId":"chr_dorian"}'

Dev Toggles & Tips
	•	Force consent screen: set GOOGLE_FORCE_CONSENT=true or use GET /api/auth/google?force=1
	•	Frontend later: switch FE_ORIGIN to http://localhost:5173 when Vite FE runs
	•	Local Mongo (no replica set): transactions gracefully fall back; safe for dev

Docs
	•	Sessions API: docs/sessions.md

Troubleshooting
	•	401 UNAUTHENTICATED: Login first (/api/auth/google) or enable DEV_FAKE_USER=1 in development.
	•	OAuth not redirecting: Check GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL and Authorized redirect URI in Google Console.
	•	Cookie issues: In dev cookie is httpOnly, sameSite=lax, secure=false. In prod set secure=true and proper domain/HTTPS.
# 📖 Plaible.art

Plaible.art is a **story-driven interactive reading and role-playing platform**.  
Users can step into classic public-domain stories, choose characters, and live unique branching experiences.

---

## ✨ Features
- Interactive story sessions  
- Character role-play with AI (Storyrunner) support  
- Wallet and credit system  
- Feedback, rating, and sharing options  
- Re-engagement messages from in-world characters  

---

## 🛠️ Tech Stack
- **Backend**: Node.js + Express + MongoDB (Mongoose)  
- **Frontend**: React + Vite + Tailwind  
- **AI**: OpenAI API (Storyrunner AI)  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone git@github.com:serkancanberk/plaible.git
cd plaible
```

---

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
Create a `.env` file in the root:
```bash
cp .env.example .env
```
Fill in MongoDB, OpenAI, and other keys.

### 4. Run the development server
```bash
npm run dev
```

### 5. Run seed and test scripts
```bash
npm run seed:story
npm run test:story
```

---

## 📂 Project Structure
- `models/` → Mongoose schemas (User, Story, Session, WalletTransaction)  
- `routes/` → Express routers (users, stories, sessions)  
- `scripts/` → Seeder and test scripts  
- `frontend/` → React + Vite app (WIP)  

---

## 🔐 Authentication

Google OAuth + JWT cookie-based auth is available.

1. Set env variables in `.env` (see `.env.example`):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - `JWT_SECRET`
2. Start the flow:
   - Visit `/api/auth/google` → Google login → callback sets `plaible_jwt` (HttpOnly)
3. API helpers:
   - `GET /api/auth/me` → returns current user safe fields
   - `POST /api/auth/logout` → clears cookie
   - `GET /api/auth/ping` → `{ ok:true, userId }` for quick checks
4. Dev mode: if no cookie and `NODE_ENV=development`, a fixed `req.userId` is used so existing routes continue to work.

---

## 🤝 Contributing
1. Fork the repo  
2. Create a new branch (`git checkout -b feature/my-feature`)  
3. Commit changes (`git commit -m "Add feature"`)  
4. Push branch and open a Pull Request  

---

## 📜 License
- Story content uses **public-domain classics**.  
- Code is licensed under **MIT**.  
- Bu güzel dünya kardeşim böyle!

- Frontend wireframe branch started