# 🔥 CodeRoast

> Submit your worst code. Get roasted. Learn from mistakes.

**Live site:** http://10.93.24.228

## What is it?

CodeRoast is a platform where developers submit their worst code and get AI-powered feedback:
- 🔥 **Roast** — a funny, sarcastic breakdown of your mistakes
- ✅ **Solution** — corrected code with explanations
- 🍝 **Spaghetti Score** — a "messiness" rating from 0 to 100
- 🌶️ **Spiciness selector** — choose the AI tone: mild, medium, or hot

## How to use

1. Go to **http://10.93.24.228**
2. Select a programming language
3. Paste your code
4. Pick a spice level: 🌶️ Baby Spice / 🌶️🌶️ Code Salsa / 🌶️🌶️🌶️ Inferno
5. Hit **🔥 Roast My Code!**
6. Get your roast + solution
7. (Optional) Enter your name and click **Share** — your roast appears in the **Hall of Shame**

## Pages

| Page | Description |
|------|-------------|
| 🏠 **Home** | Code submission form |
| 🔥 **Recently Roasted** | All published roasts (permanent) |
| 🏆 **Hall of Shame** | Today's top roasts — resets at midnight |

## For developers

### Local development

```bash
# 1. Start the database
docker-compose up -d

# 2. Backend
cd backend
cp .env.example .env   # add your LLM_API_KEY
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### VM deployment (10.93.24.228)

```bash
ssh user@10.93.24.228

git clone <repo-url> /opt/coderoast
cd /opt/coderoast

# Create .env files
cat > backend/.env << 'EOF'
LLM_API_KEY=sk-or-v1-xxxxx
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://10.93.24.228
EOF

# Start only the database first
docker compose -f docker-compose.prod.yml up -d postgres

# Wait a few seconds, then run migrations
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Start all containers
docker compose -f docker-compose.prod.yml up -d
```

The site will be available at http://10.93.24.228

## Tech stack

- **Frontend:** React 18 + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** OpenRouter (OpenAI-compatible API, free models)

## Limits

- Maximum **5,000 characters** per submission
- **10 submissions** per 15 minutes per IP
- **1 like** per submission per IP (resets after 24 hours)

## License

MIT
