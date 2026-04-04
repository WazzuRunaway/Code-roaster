# 🔥 CodeRoast

> Submit your worst code. Get roasted. Learn from mistakes.

A platform where developers submit snippets of their worst code, and an AI brutally roasts their logic while offering the correct solution.

## Quick Start

```bash
# Start database
docker-compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173` to start roasting.

## Tech Stack

- **Frontend:** React 18 + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** Google Gemini (free tier)

## License

MIT
