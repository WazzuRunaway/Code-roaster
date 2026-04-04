export interface Submission {
  id: string;
  code: string;
  language: string;
  roast: string;
  solution: string;
  spiciness: string;
  spaghettiScore: number;
  authorName?: string;
  isPublic: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  submissionId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface LikeResponse {
  likes: number;
}
