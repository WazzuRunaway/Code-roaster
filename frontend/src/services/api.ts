import axios, { AxiosError } from 'axios';
import type { Submission, Comment, LikeResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 180000, // 3 minutes for AI responses
});

// ─── Error Interceptor ──────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error || error.message || 'Unknown error';
    const status = error.response?.status;
    const err = new Error(message);
    (err as Error & { status?: number }).status = status;
    return Promise.reject(err);
  }
);

// ─── Submission Endpoints ───────────────────────────────────────────
export const submitCode = async (code: string, language: string, spiciness: string) => {
  const { data } = await api.post<Submission>('/submit', { code, language, spiciness });
  return data;
};

export const getSubmission = async (id: string) => {
  const { data } = await api.get<Submission>(`/submissions/${id}`);
  return data;
};

export const publishSubmission = async (id: string, authorName: string) => {
  const { data } = await api.patch<Submission>(`/submissions/${id}/publish`, { authorName });
  return data;
};

export const likeSubmission = async (id: string) => {
  const { data } = await api.post<LikeResponse>(`/submissions/${id}/like`);
  return data;
};

// ─── Comment Endpoints ──────────────────────────────────────────────
export const getComments = async (id: string) => {
  const { data } = await api.get<Comment[]>(`/submissions/${id}/comments`);
  return data;
};

export const addComment = async (id: string, authorName: string, text: string) => {
  const { data } = await api.post<Comment>(`/submissions/${id}/comments`, { authorName, text });
  return data;
};

// ─── Feed Endpoints ─────────────────────────────────────────────────
export const getRecentlyRoasted = async () => {
  const { data } = await api.get<Submission[]>('/roasted');
  return data;
};

export const getHallOfShame = async () => {
  const { data } = await api.get<Submission[]>('/hallofshame');
  return data;
};
