import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import submissionRoutes from './routes/submissions';

dotenv.config();
const app = express();

// ─── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://10.93.24.228',
  'http://10.93.24.228:5173',
  process.env.FRONTEND_URL,
].filter((v): v is string => Boolean(v));

if (allowedOrigins.length === 0) {
  console.warn('⚠️  No CORS origins configured — allowing all origins (dev mode)');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ──────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limit submissions to 10 per 15 min
  message: { error: 'Too many submissions, please wait a bit.' },
});

app.use('/api', apiLimiter);

// ─── Middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Routes ─────────────────────────────────────────────────────────
app.use('/api', submissionRoutes);

// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ──────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🔥 Server running on port ${PORT}`));
