import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import submissionRoutes from './routes/submissions';

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
      console.log('CORS blocked:', origin);
      callback(null, true); // allow all in dev mode
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS explicitly
app.options('*', cors());

app.use(express.json());

// Routes
app.use('/api', submissionRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🔥 Server running on port ${PORT}`));
