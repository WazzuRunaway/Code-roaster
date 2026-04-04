import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSubmission } from '../services/api';

interface Submission {
  id: string;
  code: string;
  language: string;
  roast: string;
  solution: string;
  spiciness: string;
  spaghettiScore: number;
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

  const getSpiceLabel = (score: number) => {
    if (score >= 80) return '🍝🍝🍝 Maximum Spaghetti';
    if (score >= 60) return '🍝🍝 Pretty Tangled';
    if (score >= 40) return '🍝 A Bit Messy';
    return '🍽️ Surprisingly Clean';
  };

  const getSpiceColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
          <div className="flex justify-center gap-3">
            <span className="bg-orange-600 px-3 py-1 rounded text-sm">{submission.language}</span>
            <span className="bg-purple-600 px-3 py-1 rounded text-sm capitalize">
              {submission.spiciness}
            </span>
          </div>
        </div>

        {/* Spaghetti Meter */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">🍝 Spaghetti Score</h2>
            <span className="text-2xl font-bold">{submission.spaghettiScore}/100</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${getSpiceColor(submission.spaghettiScore)}`}
              style={{ width: `${submission.spaghettiScore}%` }}
            />
          </div>
          <p className="text-gray-400 mt-2 text-center">{getSpiceLabel(submission.spaghettiScore)}</p>
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
