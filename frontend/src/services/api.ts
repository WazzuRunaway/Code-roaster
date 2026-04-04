import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const submitCode = async (code: string, language: string) => {
  const response = await axios.post(`${API_URL}/submit`, { code, language });
  return response.data;
};

export const getSubmission = async (id: string) => {
  const response = await axios.get(`${API_URL}/submissions/${id}`);
  return response.data;
};

export const getSubmissions = async () => {
  const response = await axios.get(`${API_URL}/submissions`);
  return response.data;
};
