# CodeRoast — Implementation Plan

> **Note for AI Agent:** This plan is designed for sequential, step-by-step implementation. Each task is atomic and self-contained. Follow the order strictly. Run verification after completing each version before proceeding to the next.

## Tech Stack

- **Frontend:** React 18 + TypeScript (Vite), TailwindCSS, Axios, React Router v6
- **Backend:** Node.js 20+ + Express.js, TypeScript
- **Database:** PostgreSQL 15+ + Prisma ORM
- **AI Integration:** Google Gemini API (gemini-2.0-flash) — **free tier**, no credit card required
- **DevOps:** Docker Compose (local & production), dotenv for env management
- **Target Deployment VM:** `10.93.24.228`

---

## Deployment Architecture

**Nginx** (reverse proxy, port 80) — раздаёт фронтенд и проксирует `/api/*` на бэкенд.

**Key rules for VM deployment:**
1. Backend CORS must allow `http://10.93.24.228` and `http://localhost:5173` (dev)
2. Frontend `VITE_API_URL` must point to `http://10.93.24.228/api`
3. PostgreSQL port 5432 is **not** exposed externally — only internal Docker network

---

## Version 1 — MVP (Core Feature + Foundation)

### Goal
Submit code snippets and receive AI-powered "roast" feedback with correct solutions. Submissions are saved to the database but users have no accounts — if you close the site, you lose your personal history. Includes database, backend API, and frontend UI.

### Execution Order
**Complete tasks in this exact order:**
1. Project setup (backend → frontend → docker)
2. Database schema & migrations
3. Backend API + AI integration
4. Frontend UI + routing
5. Integration testing & verification

### Backend Setup

- [x] Create `backend/` directory, `package.json` with dependencies
- [x] Install dependencies: `express`, `cors`, `dotenv`, `@google/generative-ai`, `@prisma/client`
- [x] Install devDependencies: `typescript`, `@types/express`, `@types/node`, `@types/cors`, `tsx`, `prisma`
- [x] Create `tsconfig.json`
- [x] Create `src/index.ts` with Express server + CORS config
- [x] Add scripts to `package.json`: `dev`, `build`, `start`

### Database Setup

- [x] Initialize Prisma: `npx prisma init`
- [x] Create `docker-compose.yml` (local dev — PostgreSQL only)
- [x] Create `docker-compose.prod.yml` (VM deployment — full stack)
- [x] Define Prisma schema (`prisma/schema.prisma`):
  - `Submission`: id, code, language, roast, solution, createdAt, updatedAt
- [x] Run migration: `npx prisma migrate dev --name init`
- [x] Generate Prisma client: `npx prisma generate`

### Backend API + AI Integration

- [x] Create Prisma client singleton (`src/utils/prisma.ts`)
- [x] Create AI service (`src/services/ai.ts`) — Gemini integration with fallback mock
- [x] Create submission controller (`src/controllers/submissionController.ts`):
  - `submitCode` — POST /api/submit
  - `getAllSubmissions` — GET /api/submissions
  - `getSubmissionById` — GET /api/submissions/:id
- [x] Create routes (`src/routes/submissions.ts`)
- [x] Register routes + health check in `src/index.ts`

### Frontend Setup

- [x] Create `frontend/` with `package.json`, `vite.config.ts`, `tsconfig.json`
- [x] Install dependencies: `react`, `react-dom`, `react-router-dom`, `axios`
- [x] Install devDependencies: `tailwindcss`, `postcss`, `autoprefixer`, `@vitejs/plugin-react`, types
- [x] Configure Tailwind (`tailwind.config.js`, `postcss.config.js`, `src/index.css`)
- [x] Create `index.html` and `src/main.tsx`

### Frontend Pages

- [x] Create API service (`src/services/api.ts`): `submitCode`, `getSubmission`, `getSubmissions`
- [x] Create `Navbar` component with Home + Hall of Shame links
- [x] Create `HomePage` (`/`): language selector, code textarea, submit button, error state
- [x] Create `ResultPage` (`/result/:id`): display roast + solution, loading + error states
- [x] Set up routing in `App.tsx`

### DevOps

- [x] Create `backend/.env.example`
- [x] Create `frontend/.env.example`
- [x] Create `backend/Dockerfile` (multi-stage build)
- [x] Create `frontend/Dockerfile` (multi-stage with Nginx)
- [x] Create `frontend/nginx.conf` (SPA routing + API proxy)
- [x] Create `.gitignore`

### Verification

- [x] `docker-compose up -d` starts PostgreSQL
- [x] Backend starts without errors (`npm run dev`)
- [x] `POST /api/submit` returns roast + solution
- [x] Frontend loads at `http://localhost:5173`
- [x] Form submission navigates to result page
- [x] All data persists in database
- [x] Health check at `GET /health` returns `{"status":"ok"}`

**Note on "no auth" design:** Submissions are saved to the database with UUID, but users have no way to look up their own history without the direct link. No localStorage needed — the database stores everything; public feed will use it later.

---

## Version 2 — Spiciness Selector & Spaghetti Meter

### Goal
Let users choose AI tone intensity and see a "spaghetti code" score for each submission.

### Execution Order
1. Database migration (add spiciness + spaghettiScore)
2. Update AI prompt for tone + scoring
3. Frontend: add selector UI + score display

### Database Migration

- [ ] Update Prisma schema — add to `Submission`:
  - `spiciness String @default("medium")`
  - `spaghettiScore Int @default(0)`
- [ ] Run migration: `npx prisma migrate dev --name add_spiciness_and_score`
- [ ] Regenerate Prisma client: `npx prisma generate`

### Backend

- [ ] Update `generateRoast()` in `ai.ts` to accept `spiciness` parameter:
  - Tone mapping: `mild` → gentle, `medium` → balanced sarcasm, `hot` → brutally honest
  - Prompt includes tone description
  - Response JSON adds `spaghettiScore` (0-100)
- [ ] Update `submitCode` controller to accept `spiciness` from request body
- [ ] Store both `spiciness` and `spaghettiScore` in database

### Frontend

- [ ] Add spiciness selector to `HomePage.tsx`:
  - Radio buttons: `🌶️ Mild` | `🌶️🌶️ Medium` | `🌶️🌶️🌶️ Hot`
  - Default: `medium`
- [ ] Pass `spiciness` to `submitCode()` API call
- [ ] Display Spaghetti Meter on `ResultPage.tsx`:
  - Progress bar (0-100%) with color gradient (green → orange → red)
  - Label: `🍝 Spaghetti Score: 75/100`
- [ ] Update `Navbar.tsx` to include Hall of Shame link

### Verification

- [ ] Spiciness affects roast tone and content
- [ ] Spaghetti score displays on result page with progress bar
- [ ] Data persists correctly in database
- [ ] Default `medium` spiciness works when not specified

---

## Version 3 — Recently Roasted (Name + Share)

### Goal
After receiving AI feedback, users can optionally enter their name and share their roast in a public "Recently Roasted" list. No registration required — just type a name and publish.

### Execution Order
1. Database migration (add authorName + isPublic)
2. Backend endpoints (publish submission)
3. Frontend: name input + "Share" button on ResultPage
4. Recently Roasted page

### Database Migration

- [ ] Update Prisma schema — add to `Submission`:
  - `authorName String? @db.VarChar(50)`
  - `isPublic Boolean @default(false)`
- [ ] Run migration: `npx prisma migrate dev --name add_author_and_public`
- [ ] Regenerate Prisma client

### Backend

- [ ] Update `submitCode` controller — accept optional `authorName` and `isPublic` fields
- [ ] Add `publishSubmission` endpoint:
  - `PATCH /api/submissions/:id/publish`
  - Body: `{ authorName: string }`
  - Sets `isPublic = true` and saves name
  - Validates name length (max 50 chars, trimmed)
- [ ] Add `GET /api/public` endpoint:
  - Returns only submissions where `isPublic = true`
  - Ordered by `createdAt DESC`, limit 100

### Frontend

- [ ] Add to `ResultPage.tsx`:
  - After roast loads, show optional input: "Want to share? Enter your name:"
  - "🔥 Share My Roast" button (disabled if no name entered)
  - On success: show confirmation "Shared publicly!"
- [ ] Create `RecentlyRoasted` page (`/roasted`):
  - List of public submissions with author names
  - Each card: author name, language badge, code preview (truncated), roast preview
  - Link to full result: "See full roast →"
  - Sorted by newest first
- [ ] Add route and navbar link: "🔥 Recently Roasted"

### Verification

- [ ] Users can share submissions with a name
- [ ] Published submissions appear in Recently Roasted list
- [ ] Unpublished submissions do NOT appear in public list
- [ ] Name validation works (empty/too long rejected)
- [ ] Page is responsive and performant

---

## Version 4 — Hall of Shame (Feed with Likes & Comments)

### Goal
A public feed where users can browse shared submissions, like them, and leave comments.

### Execution Order
1. Database migration (add likes + comments model)
2. Backend endpoints (like + comments CRUD)
3. Frontend feed page with interactions

### Database Migration

- [ ] Update Prisma schema:
  - Add `likes Int @default(0)` to `Submission`
  - Add `Comment` model: id, submissionId (FK), text, createdAt
  - Add `comments Comment[]` relation to `Submission`
  - Cascade delete comments when submission is deleted
- [ ] Run migration: `npx prisma migrate dev --name add_likes_and_comments`
- [ ] Regenerate Prisma client

### Backend

- [ ] Add to `submissionController.ts`:
  - `likeSubmission` — POST /api/submissions/:id/like (increment likes)
  - `getComments` — GET /api/submissions/:id/comments
  - `addComment` — POST /api/submissions/:id/comments
  - Validate comment text (non-empty, max 500 chars)
- [ ] Register new routes in `submissions.ts`
- [ ] Update `GET /api/public` to include `likes` count in response

### Frontend

- [ ] Create or update `FeedPage.tsx` (`/feed`):
  - Paginated list of public submissions
  - Each card: code preview, roast preview, author name, likes, date
  - Like button (🔥) with counter
  - "View full" link → ResultPage
- [ ] Expandable comments section per card:
  - Show existing comments
  - Comment input + submit button
  - Comments sorted by newest first
- [ ] Add sort/filter controls:
  - Sort by: Newest, Most Liked, Highest Spaghetti Score
- [ ] Update navbar: "🏆 Hall of Shame" link

### Verification

- [ ] Like endpoint increments counter correctly
- [ ] Comments can be added, retrieved, and displayed
- [ ] Feed page is paginated and sorted correctly
- [ ] Navigation works between all pages
- [ ] All data persists in database

---

## Version 5 — Polish & Production

### Features

- [ ] Loading spinners and smooth transitions
- [ ] Toast notifications (react-hot-toast)
- [ ] Empty states for feed pages
- [ ] Mobile responsive tweaks
- [ ] Rate limiting on backend (`express-rate-limit`)
- [ ] Error boundaries on frontend
- [ ] Better code highlighting (syntax highlight for roast solutions)

### DevOps

- [ ] Full Docker Compose production deployment on VM
- [ ] Health check endpoint monitoring
- [ ] Set up GitHub Actions for CI/CD
- [ ] Add SSL (if certificate available)

### Verification

- [ ] All features tested end-to-end
- [ ] No console errors on any page
- [ ] Mobile layout verified
- [ ] Production deployment on 10.93.24.228 working

---

## Project Structure

```
Code-roaster/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   └── submissionController.ts
│   │   ├── routes/
│   │   │   └── submissions.ts
│   │   ├── services/
│   │   │   └── ai.ts
│   │   ├── utils/
│   │   │   └── prisma.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── FeedPage.tsx
│   │   │   └── ResultPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```

---

## Quick Start (Local Development)

```bash
# 1. Start database
docker-compose up -d

# 2. Backend setup
cd backend
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend setup
cd ../frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start roasting code 🔥

---

## VM Deployment Guide (10.93.24.228)

### Deployment Steps

1. SSH into VM: `ssh user@10.93.24.228`
2. Clone repo to `/opt/coderoast`
3. Create `backend/.env` with `DATABASE_URL`, `GEMINI_API_KEY`, `NODE_ENV=production`
4. Create root `.env.prod` with `DB_USER` and `DB_PASSWORD`
5. Run: `docker-compose -f docker-compose.prod.yml up -d --build`
6. Run migrations: `docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy`

### Access Points

| Service | URL |
|---------|-----|
| Frontend | `http://10.93.24.228` |
| Backend API | `http://10.93.24.228/api` |

### Updating the App

```bash
cd /opt/coderoast
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## Common AI Agent Pitfalls to Avoid

1. **Never skip verification:** Run the app after each version. Test all endpoints manually.
2. **Don't parallelize versions:** Complete v1 fully before starting v2.
3. **Use provided code templates:** Don't improvise on boilerplate. The code snippets are battle-tested.
4. **Handle env vars carefully:** Never commit `.env` files. Always use `.env.example`.
5. **Prisma client regeneration:** Always run `npx prisma generate` after schema changes.
6. **CORS issues:** Ensure backend CORS is configured before testing frontend.
7. **JSON parsing from Gemini:** Gemini may wrap JSON in markdown code blocks. Always strip them before parsing.
8. **Gemini free tier limits:** 15 RPM, 1M tokens/min. The fallback mock avoids this issue during dev.
9. **VM binding:** Backend must listen on `0.0.0.0`, not `localhost` or `127.0.0.1` — otherwise Docker can't reach it.
10. **Internal DB network:** In production docker-compose, PostgreSQL is accessed via service name `postgres`, not `localhost`.
11. **Nginx SPA routing:** The `try_files $uri $uri/ /index.html;` directive is critical — without it, refreshing `/feed` returns 404.
12. **Build-time env for frontend:** `VITE_API_URL` is baked in at build time. Changing it requires a rebuild.
13. **Migration in production:** Use `prisma migrate deploy` (not `dev`) in production/VM to avoid interactive prompts.
