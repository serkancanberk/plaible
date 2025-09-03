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