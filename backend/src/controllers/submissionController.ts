import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { generateRoast } from '../services/ai';
import { prisma } from '../utils/prisma';

// ─── Helpers ────────────────────────────────────────────────────────
function parseId(req: Request): string {
  return req.params.id as string;
}

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ─── Controllers ────────────────────────────────────────────────────
export const submitCode = asyncHandler(async (req, res) => {
  const { code, language, spiciness } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }
  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'Language is required' });
  }
  if (code.length > 50000) {
    return res.status(400).json({ error: 'Code is too long (max 50KB)' });
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
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, code: true, language: true, roast: true,
      spiciness: true, spaghettiScore: true, authorName: true,
      isPublic: true, likes: true, createdAt: true, updatedAt: true,
    },
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

  const trimmed = authorName.trim().slice(0, 50);

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

  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });
    res.json({ likes: submission.likes });
  } catch {
    return res.status(404).json({ error: 'Submission not found' });
  }
});

export const getComments = asyncHandler(async (req, res) => {
  const id = parseId(req);

  const comments = await prisma.comment.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: 'desc' },
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
        authorName: authorName.trim().slice(0, 50),
        text: text.trim().slice(0, 500),
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
    select: {
      id: true, code: true, language: true, roast: true,
      authorName: true, spaghettiScore: true, likes: true,
      createdAt: true, updatedAt: true,
    },
  });
  res.json(submissions);
});

export const getHallOfShame = asyncHandler(async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { isPublic: true },
    orderBy: { likes: 'desc' },
    take: 100,
    select: {
      id: true, code: true, language: true, roast: true,
      authorName: true, spaghettiScore: true, likes: true,
      createdAt: true, updatedAt: true,
    },
  });
  res.json(submissions);
});
