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

```
┌─────────────────────────────────────────────────┐
│              VM: 10.93.24.228                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Nginx (reverse proxy, port 80)                 │
│  ├── /        → Frontend (port 5173 dev / 80)   │
│  └── /api/*   → Backend (port 3000)             │
│                                                 │
│  Docker Compose:                                │
│  ├── coderoast-backend  (port 3000)             │
│  ├── coderoast-frontend (port 5173 dev)         │
│  └── coderoast-db       (port 5432 internal)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key rules for VM deployment:**
1. Backend CORS must allow `http://10.93.24.228` and `http://localhost:5173` (dev)
2. Frontend `VITE_API_URL` must point to `http://10.93.24.228/api`
3. PostgreSQL port 5432 is **not** exposed externally — only internal Docker network
4. Nginx handles SSL termination (if SSL certificate is available)

---

## Version 1 — MVP (Core Feature + Foundation)

### Goal
Submit code snippets and receive AI-powered "roast" feedback with correct solutions. Includes database, backend API, and frontend UI.

### Execution Order
**Complete tasks in this exact order:**

1. Project setup (backend → frontend → docker)
2. Database schema & migrations
3. Backend API + AI integration
4. Frontend UI + routing
5. Integration testing & verification

### Backend Setup

- [ ] Create `backend/` directory, run `npm init -y`
- [ ] Install dependencies:
  ```bash
  npm install express cors dotenv @google/generative-ai
  npm install -D typescript @types/express @types/node @types/cors ts-node tsx nodemon
  ```
- [ ] Create `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    }
  }
  ```
- [ ] Create `src/index.ts` with basic Express server:
  ```typescript
  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';

  dotenv.config();
  const app = express();

  // CORS: allow both localhost (dev) and VM IP (production)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://10.93.24.228',
    'http://10.93.24.228:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json());

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  ```
- [ ] Add scripts to `package.json`:
  ```json
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
  ```

### Database Setup

- [ ] Initialize Prisma: `npx prisma init`
- [ ] Create `docker-compose.yml` in project root (local dev):
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15-alpine
      container_name: coderoast-db
      environment:
        POSTGRES_USER: coderoast
        POSTGRES_PASSWORD: coderoast_password
        POSTGRES_DB: coderoast
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
    volumes:
      postgres_data:
  ```
- [ ] Create `docker-compose.prod.yml` in project root (VM deployment):
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15-alpine
      container_name: coderoast-db
      environment:
        POSTGRES_USER: ${DB_USER}
        POSTGRES_PASSWORD: ${DB_PASSWORD}
        POSTGRES_DB: coderoast
      volumes:
        - postgres_data:/var/lib/postgresql/data
      networks:
        - coderoast-net
      restart: unless-stopped

    backend:
      build:
        context: ./backend
        dockerfile: Dockerfile
      container_name: coderoast-backend
      env_file:
        - ./backend/.env
      environment:
        - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/coderoast?schema=public
        - NODE_ENV=production
      ports:
        - "3000:3000"
      depends_on:
        - postgres
      networks:
        - coderoast-net
      restart: unless-stopped

    frontend:
      build:
        context: ./frontend
        dockerfile: Dockerfile
        args:
          - VITE_API_URL=http://10.93.24.228/api
      container_name: coderoast-frontend
      ports:
        - "80:80"
      depends_on:
        - backend
      networks:
        - coderoast-net
      restart: unless-stopped

  networks:
    coderoast-net:
      driver: bridge

  volumes:
    postgres_data:
  ```
- [ ] Update `.env` with `DATABASE_URL="postgresql://coderoast:coderoast_password@localhost:5432/coderoast?schema=public"`
- [ ] Define Prisma schema (`prisma/schema.prisma`):
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  model Submission {
    id        String   @id @default(uuid())
    code      String   @db.Text
    language  String
    roast     String   @db.Text
    solution  String   @db.Text
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name init`
- [ ] Generate Prisma client: `npx prisma generate`

### Backend API + AI Integration

- [ ] Create Prisma client singleton (`src/utils/prisma.ts`):
  ```typescript
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

  export const prisma = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```
- [ ] Create AI service (`src/services/ai.ts`):
  ```typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  export async function generateRoast(code: string, language: string) {
    const prompt = `You are a brutally honest code reviewer. Analyze this ${language} code and provide:
    1. A funny, sarcastic roast pointing out the mistakes (2-3 paragraphs)
    2. A clean, corrected solution with explanations

    Code:
    \`\`\`${language}
    ${code}
    \`\`\`

    Respond in EXACTLY this JSON format (no extra text, no markdown wrapping):
    {"roast": "your roast here", "solution": "the corrected code here"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code blocks if Gemini wraps JSON in them
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse AI response: ${cleaned.slice(0, 200)}`);
    }
  }
  ```
- [ ] Create submission controller (`src/controllers/submissionController.ts`):
  ```typescript
  import { Request, Response } from 'express';
  import { generateRoast } from '../services/ai';
  import { prisma } from '../utils/prisma';

  export async function submitCode(req: Request, res: Response) {
    try {
      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      const { roast, solution } = await generateRoast(code, language);

      const submission = await prisma.submission.create({
        data: { code, language, roast, solution },
      });

      res.json(submission);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process submission' });
    }
  }

  export async function getAllSubmissions(_req: Request, res: Response) {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(submissions);
  }

  export async function getSubmissionById(req: Request, res: Response) {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id } });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  }
  ```
- [ ] Create routes (`src/routes/submissions.ts`):
  ```typescript
  import { Router } from 'express';
  import { submitCode, getAllSubmissions, getSubmissionById } from '../controllers/submissionController';

  const router = Router();

  router.post('/submit', submitCode);
  router.get('/submissions', getAllSubmissions);
  router.get('/submissions/:id', getSubmissionById);

  export default router;
  ```
- [ ] Register routes in `src/index.ts`:
  ```typescript
  import submissionRoutes from './routes/submissions';
  app.use('/api', submissionRoutes);
  ```

### Frontend Setup

- [ ] Create frontend app: `npm create vite@latest frontend -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  cd frontend
  npm install axios react-router-dom
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Configure Tailwind (`tailwind.config.js`):
  ```javascript
  export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: { extend: {} },
    plugins: [],
  }
  ```
- [ ] Add Tailwind directives to `src/index.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Set up router in `src/App.tsx`:
  ```tsx
  import { BrowserRouter, Routes, Route } from 'react-router-dom';
  import HomePage from './pages/HomePage';
  import ResultPage from './pages/ResultPage';

  function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:id" element={<ResultPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  export default App;
  ```

### Frontend Pages

- [ ] Create API service (`src/services/api.ts`):
  ```typescript
  import axios from 'axios';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  export const submitCode = async (code: string, language: string) => {
    const response = await axios.post(`${API_URL}/submit`, { code, language });
    return response.data;
  };

  export const getSubmission = async (id: string) => {
    const response = await axios.get(`${API_URL}/submissions/${id}`);
    return response.data;
  };
  ```
- [ ] Create Home page (`src/pages/HomePage.tsx`):
  ```tsx
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { submitCode } from '../services/api';

  const languages = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust'];

  export default function HomePage() {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState(languages[0]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const submission = await submitCode(code, language);
        navigate(`/result/${submission.id}`);
      } catch (error) {
        console.error(error);
        alert('Failed to submit code');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold text-center mb-2">🔥 CodeRoast</h1>
        <p className="text-gray-400 text-center mb-8">Submit your worst code. Get roasted.</p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-700"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-64 p-4 rounded bg-gray-800 border border-gray-700 font-mono text-sm"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold disabled:opacity-50"
          >
            {loading ? 'Roasting...' : '🔥 Roast My Code!'}
          </button>
        </form>
      </div>
    );
  }
  ```
- [ ] Create Result page (`src/pages/ResultPage.tsx`):
  ```tsx
  import { useParams, useNavigate } from 'react-router-dom';
  import { useEffect, useState } from 'react';
  import { getSubmission } from '../services/api';

  export default function ResultPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<any>(null);

    useEffect(() => {
      if (id) {
        getSubmission(id).then(setSubmission);
      }
    }, [id]);

    if (!submission) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">🔥 The Roast Is In!</h1>

          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">💀 What You Did Wrong</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{submission.roast}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">✅ How To Fix It</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm">
              <code>{submission.solution}</code>
            </pre>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }
  ```

### DevOps & Verification

- [ ] Create `.env.example` (backend):
  ```
  # Database (local dev)
  DATABASE_URL="postgresql://coderoast:coderoast_password@localhost:5432/coderoast?schema=public"

  # Database (VM production) — uncomment and update for prod
  # DATABASE_URL="postgresql://<db_user>:<db_password>@postgres:5432/coderoast?schema=public"

  # AI — Google Gemini (free tier, get key at https://aistudio.google.com/apikey)
  GEMINI_API_KEY="your-key-here"

  # Server
  PORT=3000
  NODE_ENV=development

  # CORS
  FRONTEND_URL="http://10.93.24.228"
  ```
- [ ] Create `.env.example` (frontend):
  ```
  # Local dev
  VITE_API_URL=http://localhost:3000/api

  # VM production — use this when deploying
  # VITE_API_URL=http://10.93.24.228/api
  ```
- [ ] Create `backend/Dockerfile`:
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  COPY tsconfig.json ./
  RUN npx prisma generate
  RUN npm run build

  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
  EXPOSE 3000
  CMD ["node", "dist/index.js"]
  ```
- [ ] Create `frontend/Dockerfile` (multi-stage with Nginx):
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  ARG VITE_API_URL=http://localhost:3000/api
  ENV VITE_API_URL=$VITE_API_URL
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```
- [ ] Create `frontend/nginx.conf`:
  ```nginx
  server {
      listen 80;
      server_name _;
      root /usr/share/nginx/html;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      # Proxy API requests to backend
      location /api/ {
          proxy_pass http://backend:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```
- [ ] Add `.gitignore` entries:
  ```
  **/node_modules
  **/.env
  **/dist
  **/.env.local
  ```
- [ ] **Verification checklist (local):**
  - [ ] `docker-compose up -d` starts PostgreSQL
  - [ ] Backend starts without errors (`npm run dev`)
  - [ ] `POST /api/submit` returns roast + solution
  - [ ] Frontend loads at `http://localhost:5173`
  - [ ] Form submission navigates to result page
  - [ ] All data persists in database
- [ ] **Verification checklist (VM 10.93.24.228):**
  - [ ] `docker-compose -f docker-compose.prod.yml up -d --build` succeeds
  - [ ] Frontend accessible at `http://10.93.24.228`
  - [ ] API accessible at `http://10.93.24.228/api/submissions`
  - [ ] CORS works (no errors in browser console)
  - [ ] Migrations applied via `prisma migrate deploy`
  - [ ] PostgreSQL not exposed on host port (only internal Docker network)

---

## Version 2 — Hall of Shame Feed (Simplest Additional Feature)

### Goal
Public feed where users can browse submissions, like, and comment.

### Execution Order
1. Database migration (add likes + comments)
2. Backend endpoints (like + comments)
3. Frontend feed page with pagination

### Database Migration

- [ ] Update Prisma schema:
  ```prisma
  model Submission {
    id        String   @id @default(uuid())
    code      String   @db.Text
    language  String
    roast     String   @db.Text
    solution  String   @db.Text
    likes     Int      @default(0)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    comments  Comment[]
  }

  model Comment {
    id           String   @id @default(uuid())
    submissionId String
    text         String   @db.Text
    createdAt    DateTime @default(now())
    submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add_likes_and_comments`

### Backend Endpoints

- [ ] Add to `submissionController.ts`:
  ```typescript
  export async function likeSubmission(req: Request, res: Response) {
    const { id } = req.params;
    const submission = await prisma.submission.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    res.json(submission);
  }

  export async function getComments(req: Request, res: Response) {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { submissionId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  }

  export async function addComment(req: Request, res: Response) {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const comment = await prisma.comment.create({
      data: { submissionId: id, text },
    });
    res.json(comment);
  }
  ```
- [ ] Register new routes in `submissions.ts`:
  ```typescript
  router.post('/submissions/:id/like', likeSubmission);
  router.get('/submissions/:id/comments', getComments);
  router.post('/submissions/:id/comments', addComment);
  ```

### Frontend Feed Page

- [ ] Add feed route to `App.tsx`:
  ```tsx
  import FeedPage from './pages/FeedPage';
  // ...
  <Route path="/feed" element={<FeedPage />} />
  ```
- [ ] Add navigation bar component (`src/components/Navbar.tsx`):
  ```tsx
  import { Link } from 'react-router-dom';

  export default function Navbar() {
    return (
      <nav className="bg-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Link to="/" className="text-white font-bold">🏠 Home</Link>
          <Link to="/feed" className="text-white font-bold">🏆 Hall of Shame</Link>
        </div>
      </nav>
    );
  }
  ```
- [ ] Create Feed page (`src/pages/FeedPage.tsx`):
  ```tsx
  import { useEffect, useState } from 'react';
  import axios from 'axios';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  export default function FeedPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
      axios.get(`${API_URL}/submissions`).then(res => setSubmissions(res.data));
    }, []);

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold text-center mb-8">🏆 Hall of Shame</h1>
        <div className="max-w-4xl mx-auto space-y-6">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-gray-800 p-6 rounded">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-orange-600 px-3 py-1 rounded text-sm">{sub.language}</span>
                <span className="text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</span>
              </div>
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto mb-4">
                <code>{sub.code.slice(0, 200)}...</code>
              </pre>
              <p className="text-gray-300 mb-4">{sub.roast.slice(0, 150)}...</p>
              <a href={`/result/${sub.id}`} className="text-orange-400 hover:underline">See full roast →</a>
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

### Verification

- [ ] Migration applied successfully
- [ ] Like endpoint increments counter
- [ ] Comments can be added and retrieved
- [ ] Feed page displays submissions
- [ ] Navigation works between pages

---

## Version 3 — Spiciness Selector & Spaghetti Meter

### Goal
Let users choose AI tone intensity and see a "spaghetti code" score.

### Backend

- [ ] Add to Prisma schema:
  ```prisma
  spiciness      String @default("medium")
  spaghettiScore Int    @default(0)
  ```
- [ ] Update AI service in `ai.ts` to include spiciness:
  ```typescript
  export async function generateRoast(code: string, language: string, spiciness: string) {
    const toneMap: Record<string, string> = {
      mild: 'gentle and constructive',
      medium: 'balanced with light sarcasm',
      hot: 'brutally honest and hilarious'
    };
    const tone = toneMap[spiciness] || toneMap.medium;

    const prompt = `You are a code reviewer with "${tone}" tone. Analyze this ${language} code:
    1. Rate how bad the code is from 0-100 (spaghetti score)
    2. Provide a funny roast (${tone})
    3. Give a clean solution

    Code:
    \`\`\`${language}
    ${code}
    \`\`\`

    Respond in EXACTLY this JSON format (no extra text, no markdown wrapping):
    {"spaghettiScore": 75, "roast": "your roast here", "solution": "the corrected code here"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  }
  ```
- [ ] Update controller to accept spiciness:
  ```typescript
  const { code, language, spiciness } = req.body;
  const { roast, solution, spaghettiScore } = await generateRoast(code, language, spiciness || 'medium');
  ```

### Frontend

- [ ] Add spiciness selector to `HomePage.tsx`:
  ```tsx
  const [spiciness, setSpiciness] = useState('medium');
  // In form:
  <div className="flex gap-4">
    {['mild', 'medium', 'hot'].map(level => (
      <label key={level} className="flex items-center gap-2">
        <input type="radio" name="spiciness" value={level} checked={spiciness === level} onChange={e => setSpiciness(e.target.value)} />
        {level === 'mild' && '🌶️ Mild'}
        {level === 'medium' && '🌶️🌶️ Medium'}
        {level === 'hot' && '🌶️🌶️🌶️ Hot'}
      </label>
    ))}
  </div>
  ```
- [ ] Add spaghetti meter to `ResultPage.tsx`:
  ```tsx
  <div className="bg-gray-800 p-6 rounded">
    <h2 className="text-xl font-bold mb-2">🍝 Spaghetti Score: {submission.spaghettiScore}/100</h2>
    <div className="w-full bg-gray-700 rounded-full h-4">
      <div
        className="bg-orange-600 h-4 rounded-full"
        style={{ width: `${submission.spaghettiScore}%` }}
      />
    </div>
  </div>
  ```

### Verification

- [ ] Spiciness affects roast tone
- [ ] Spaghetti score displays on result
- [ ] Progress bar renders correctly

---

## Version 4 — Redemption Mode

### Goal
AI refactors the code and users can compare original vs improved version.

### Backend

- [ ] Add to Prisma: `refactoredCode String @default("") @db.Text`
- [ ] Update AI prompt to include refactored code in response JSON
- [ ] Add endpoint: `POST /api/submissions/:id/redemption`

### Frontend

- [ ] Create comparison view using `react-diff-viewer` package:
  ```bash
  npm install react-diff-viewer
  ```
- [ ] Create `RedemptionPage.tsx` with side-by-side diff

### Verification

- [ ] Refactored code generates correctly
- [ ] Diff viewer highlights changes

---

## Version 5 — Polish & Production

### Features

- [ ] Add loading spinners (react-spinners)
- [ ] Toast notifications for errors (react-hot-toast)
- [ ] Empty states for feed
- [ ] Mobile responsive tweaks
- [ ] Rate limiting on backend (`express-rate-limit`)

### DevOps

- [ ] Dockerize full app (multi-stage builds)
- [ ] Add health check endpoint
- [ ] Set up GitHub Actions for CI/CD

### Verification

- [ ] All features tested end-to-end
- [ ] No console errors
- [ ] Mobile layout verified

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
│   ├── .env
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
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml          # Local development
├── docker-compose.prod.yml     # VM deployment (10.93.24.228)
├── .env.prod                   # VM environment variables
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
cp .env.example .env
# Edit .env with your GEMINI_API_KEY (free at https://aistudio.google.com/apikey)
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend setup
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173` to start roasting code 🔥

---

## VM Deployment Guide (10.93.24.228)

### Prerequisites on VM

- [ ] Docker & Docker Compose installed on VM
- [ ] Git repository cloned to `/opt/coderoast`
- [ ] `.env` files configured on VM (see below)

### Deployment Steps

```bash
# 1. SSH into VM
ssh user@10.93.24.228

# 2. Clone repo (if not already)
git clone <repo-url> /opt/coderoast
cd /opt/coderoast

# 3. Create backend .env
cat > backend/.env << EOF
DATABASE_URL=postgresql://coderoast:CHANGE_ME_PASSWORD@postgres:5432/coderoast?schema=public
GEMINI_API_KEY=your-key-here
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://10.93.24.228
EOF

# 4. Create root .env for docker-compose.prod.yml
cat > .env.prod << EOF
DB_USER=coderoast
DB_PASSWORD=CHANGE_ME_PASSWORD
EOF

# 5. Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Run migrations inside backend container
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Access Points After Deployment

| Service | URL |
|---------|-----|
| Frontend | `http://10.93.24.228` |
| Backend API | `http://10.93.24.228/api` |
| API Health | `http://10.93.24.228/api/submissions` |

### Firewall Rules Required

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # if SSL is configured

# Block direct DB access (should not be needed)
sudo ufw deny 5432/tcp
```

### Useful Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Rebuild after git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Backup database
docker exec coderoast-db pg_dump -U coderoast coderoast > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i coderoast-db psql -U coderoast coderoast < backup_20260404.sql
```

### Updating the App

```bash
cd /opt/coderoast
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml restart
```

---

## Common AI Agent Pitfalls to Avoid

1. **Never skip verification:** Run the app after each version. Test all endpoints manually.
2. **Don't parallelize versions:** Complete v1 fully before starting v2.
3. **Use provided code templates:** Don't improvise on boilerplate. The code snippets are battle-tested.
4. **Handle env vars carefully:** Never commit `.env` files. Always use `.env.example`.
5. **Prisma client regeneration:** Always run `npx prisma generate` after schema changes.
6. **CORS issues:** Ensure backend CORS is configured before testing frontend.
7. **JSON parsing from Gemini:** Gemini may wrap JSON in markdown code blocks (```json ... ```). Always strip them before parsing.
8. **Gemini free tier limits:** 15 RPM, 1M tokens/min. Add rate limiting to avoid hitting quotas.
9. **VM binding:** Backend must listen on `0.0.0.0`, not `localhost` or `127.0.0.1` — otherwise Docker can't reach it.
10. **Internal DB network:** In production docker-compose, PostgreSQL is accessed via service name `postgres`, not `localhost`.
11. **Nginx SPA routing:** The `try_files $uri $uri/ /index.html;` directive is critical — without it, refreshing `/feed` returns 404.
12. **Build-time env for frontend:** `VITE_API_URL` is baked in at build time. Changing it requires a rebuild.
13. **Migration in production:** Use `prisma migrate deploy` (not `dev`) in production/VM to avoid interactive prompts.
