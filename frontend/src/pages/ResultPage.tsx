import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSubmission } from '../services/api';

interface Submission {
  id: string;
  code: string;
  language: string;
  roast: string;
  solution: string;
  createdAt: string;
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      getSubmission(id)
        .then(setSubmission)
        .catch(() => setError('Failed to load submission'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">🔥 Loading your roast...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">{error || 'Submission not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🔥 The Roast Is In!</h1>
          <span className="bg-orange-600 px-3 py-1 rounded text-sm">{submission.language}</span>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">💀 What You Did Wrong</h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{submission.roast}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">✅ How To Fix It</h2>
          <pre className="bg-gray-950 p-4 rounded overflow-x-auto text-sm text-green-400">
            <code>{submission.solution}</code>
          </pre>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold transition-colors"
        >
          🔥 Submit Another
        </button>
      </div>
    </div>
  );
}
