import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { generateRoast } from '../services/ai';
import { prisma } from '../utils/prisma';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_CODE_LENGTH = 5_000;
const SOFT_CODE_WARNING = 3_000;
const MAX_NAME_LENGTH = 50;
const MAX_COMMENT_LENGTH = 500;
const ALLOWED_LANGUAGES = new Set([
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart',
  'R', 'MATLAB', 'Scala', 'Perl', 'Lua', 'Haskell',
  'Shell', 'PowerShell', 'SQL', 'HTML/CSS', 'React',
]);

// ─── Helpers ────────────────────────────────────────────────────────
function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || (req.headers['x-real-ip'] as string)
    || req.ip
    || req.socket.remoteAddress
    || 'unknown';
}

// Simple in-memory like deduplication: Map<"ip:submissionId", expiresAt>
const likeCache = new Map<string, number>();
const LIKE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, expires] of likeCache.entries()) {
    if (now > expires) likeCache.delete(key);
  }
}, 60 * 60 * 1000);

function parseId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Invalid submission ID');
  }
  return id;
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const PUBLIC_SUBMISSION_SELECT = {
  id: true, code: true, language: true, roast: true,
  spiciness: true, spaghettiScore: true, authorName: true,
  isPublic: true, likes: true, createdAt: true, updatedAt: true,
};

const LIST_SUBMISSION_SELECT = {
  id: true, code: true, language: true, roast: true,
  spiciness: true, spaghettiScore: true, authorName: true,
  isPublic: true, likes: true, createdAt: true, updatedAt: true,
};

// ─── Controllers ────────────────────────────────────────────────────
export const submitCode = asyncHandler(async (req, res) => {
  const { code, language, spiciness } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }
  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'Language is required' });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: `Code is too long (max ${MAX_CODE_LENGTH.toLocaleString()} chars)` });
  }
  if (!ALLOWED_LANGUAGES.has(language)) {
    return res.status(400).json({ error: `Unsupported language. Allowed: ${[...ALLOWED_LANGUAGES].slice(0, 8).join(', ')}...` });
  }

  const validSpiciness = ['mild', 'medium', 'hot'].includes(spiciness)
    ? spiciness
    : 'medium';

  const { roast, solution, spaghettiScore } = await generateRoast(code, language, validSpiciness);

  const submission = await prisma.submission.create({
    data: { code, language, roast, solution, spiciness: validSpiciness, spaghettiScore },
  });

  res.status(201).json(submission);
});

export const getAllSubmissions = asyncHandler(async (_req, res) => {
  // Only return public submissions to prevent data leak
  const submissions = await prisma.submission.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: PUBLIC_SUBMISSION_SELECT,
  });
  res.json(submissions);
});

export const getSubmissionById = asyncHandler(async (req, res) => {
  const id = parseId(req);
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  res.json(submission);
});

export const publishSubmission = asyncHandler(async (req, res) => {
  const id = parseId(req);
  const { authorName } = req.body;

  if (!authorName || typeof authorName !== 'string' || !authorName.trim()) {
    return res.status(400).json({ error: 'Author name is required' });
  }

  const trimmed = authorName.trim().slice(0, MAX_NAME_LENGTH);

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { authorName: trimmed, isPublic: true },
    });
    res.json(submission);
  } catch {
    return res.status(404).json({ error: 'Submission not found' });
  }
});

export const likeSubmission = asyncHandler(async (req, res) => {
  const id = parseId(req);
  const clientIp = getClientIp(req);
  const cacheKey = `${clientIp}:${id}`;

  // Check if this IP already liked this submission
  if (likeCache.has(cacheKey)) {
    return res.status(429).json({ error: 'You already liked this roast' });
  }

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });

    // Record this like with expiry
    likeCache.set(cacheKey, Date.now() + LIKE_CACHE_TTL);

    res.json({ likes: submission.likes });
  } catch {
    return res.status(404).json({ error: 'Submission not found' });
  }
});

export const getComments = asyncHandler(async (req, res) => {
  const id = parseId(req);

  const comments = await prisma.comment.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: 'asc' },
  });

  res.json(comments);
});

export const addComment = asyncHandler(async (req, res) => {
  const id = parseId(req);
  const { authorName, text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  if (!authorName || typeof authorName !== 'string' || !authorName.trim()) {
    return res.status(400).json({ error: 'Author name is required' });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        submissionId: id,
        authorName: authorName.trim().slice(0, MAX_NAME_LENGTH),
        text: text.trim().slice(0, MAX_COMMENT_LENGTH),
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'Submission not found' });
    }
    throw err;
  }
});

export const getRecentlyRoasted = asyncHandler(async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: PUBLIC_SUBMISSION_SELECT,
  });
  res.json(submissions);
});

export const getHallOfShame = asyncHandler(async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { isPublic: true },
    orderBy: { likes: 'desc' },
    take: 100,
    select: PUBLIC_SUBMISSION_SELECT,
  });
  res.json(submissions);
});
