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
