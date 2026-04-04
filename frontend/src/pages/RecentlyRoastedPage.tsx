import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyRoasted, likeSubmission } from '../services/api';
import type { Submission } from '../types';

export default function RecentlyRoastedPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const handleLike = useCallback(async (id: string) => {
    if (likedIds.has(id)) return;
    const { likes } = await likeSubmission(id);
    setLikedIds((prev) => new Set(prev).add(id));
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, likes } : s)));
  }, [likedIds]);

  useEffect(() => {
    getRecentlyRoasted()
      .then(setSubmissions)
      .catch(() => setError('Failed to load roasts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">🔥 Loading the roasts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-2">🔥 Recently Roasted</h1>
      <p className="text-gray-400 text-center mb-8">Brave souls who shared their shame</p>

      {submissions.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <p className="text-xl">🦗 Nobody has shared their roast yet.</p>
          <Link to="/" className="text-orange-400 hover:underline mt-4 inline-block">
            Be the first! →
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border-b border-gray-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-orange-600 px-3 py-1 rounded text-sm font-medium whitespace-nowrap">
                    {sub.language}
                  </span>
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                    🍝 {sub.spaghettiScore}
                  </span>
                  {sub.authorName && (
                    <span className="bg-purple-600 px-2 py-1 rounded text-xs whitespace-nowrap truncate max-w-[120px]">
                      👤 {sub.authorName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm whitespace-nowrap">
                    {new Date(sub.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleLike(sub.id)}
                    disabled={likedIds.has(sub.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shrink-0 ${
                      likedIds.has(sub.id)
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <span className="text-xl">🔥</span>
                    <span className="font-bold">{sub.likes}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <pre className="bg-gray-950 p-4 rounded text-sm overflow-x-auto">
                  <code className="text-green-400">
                    {sub.code.length > 300
                      ? sub.code.slice(0, 300) + '\n  // ... truncated'
                      : sub.code}
                  </code>
                </pre>

                <p className="text-gray-300 italic">
                  {sub.roast.length > 200
                    ? sub.roast.slice(0, 200) + '...'
                    : sub.roast}
                </p>

                <Link
                  to={`/result/${sub.id}`}
                  className="text-orange-400 hover:underline font-medium"
                >
                  See full roast →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
