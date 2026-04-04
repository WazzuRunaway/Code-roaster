import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const submitCode = async (code: string, language: string, spiciness: string) => {
  const response = await axios.post(`${API_URL}/submit`, { code, language, spiciness });
  return response.data;
};

export const getSubmission = async (id: string) => {
  const response = await axios.get(`${API_URL}/submissions/${id}`);
  return response.data;
};

export const publishSubmission = async (id: string, authorName: string) => {
  const response = await axios.patch(`${API_URL}/submissions/${id}/publish`, { authorName });
  return response.data;
};

export const likeSubmission = async (id: string) => {
  const response = await axios.post(`${API_URL}/submissions/${id}/like`);
  return response.data;
};

export const getComments = async (id: string) => {
  const response = await axios.get(`${API_URL}/submissions/${id}/comments`);
  return response.data;
};

export const addComment = async (id: string, authorName: string, text: string) => {
  const response = await axios.post(`${API_URL}/submissions/${id}/comments`, { authorName, text });
  return response.data;
};

export const getRecentlyRoasted = async () => {
  const response = await axios.get(`${API_URL}/roasted`);
  return response.data;
};

export const getHallOfShame = async () => {
  const response = await axios.get(`${API_URL}/hallofshame`);
  return response.data;
};
