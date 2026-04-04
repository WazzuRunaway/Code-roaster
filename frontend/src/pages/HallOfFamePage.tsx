import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHallOfShame, likeSubmission, getComments, addComment } from '../services/api';

interface Submission {
  id: string;
  code: string;
  language: string;
  roast: string;
  authorName?: string;
  likes: number;
  spaghettiScore: number;
  createdAt: string;
}

interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export default function HallOfShamePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  useEffect(() => {
    getHallOfShame()
      .then(setSubmissions)
      .catch(() => setError('Failed to load Hall of Shame'))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (id: string) => {
    const { likes } = await likeSubmission(id);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, likes } : s))
    );
  };

  const loadComments = async (id: string) => {
    if (comments[id]) return;
    const data = await getComments(id);
    setComments((prev) => ({ ...prev, [id]: data }));
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await loadComments(id);
    }
  };

  const submitComment = async (id: string) => {
    if (!newComment.trim() || !commentAuthor.trim()) return;
    const comment = await addComment(id, commentAuthor.trim(), newComment.trim());
    setComments((prev) => ({
      ...prev,
      [id]: [comment, ...(prev[id] || [])],
    }));
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-xl">🏆 Loading the Hall of Shame...</p>
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
      <h1 className="text-4xl font-bold text-center mb-2">🏆 Hall of Shame</h1>
      <p className="text-gray-400 text-center mb-8">Top 100 roasts, sorted by likes</p>

      {submissions.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <p className="text-xl">🏗️ Nothing here yet.</p>
          <Link to="/" className="text-orange-400 hover:underline mt-4 inline-block">
            Submit code and share it to get featured →
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {submissions.map((sub, idx) => (
            <div key={sub.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-2xl font-bold text-orange-400 w-8 text-center">
                    #{idx + 1}
                  </span>
                  <span className="bg-orange-600 px-3 py-1 rounded text-sm font-medium">
                    {sub.language}
                  </span>
                  <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                    🍝 {sub.spaghettiScore}
                  </span>
                  {sub.authorName && (
                    <span className="bg-purple-600 px-2 py-1 rounded text-xs">
                      👤 {sub.authorName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleLike(sub.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <span className="text-xl">🔥</span>
                  <span className="font-bold">{sub.likes}</span>
                </button>
              </div>

              <div className="p-4 space-y-4">
                <pre className="bg-gray-950 p-4 rounded text-sm overflow-x-auto">
                  <code className="text-green-400">
                    {sub.code.length > 200
                      ? sub.code.slice(0, 200) + '\n  // ... truncated'
                      : sub.code}
                  </code>
                </pre>

                <p className="text-gray-300 italic">
                  {sub.roast.length > 150
                    ? sub.roast.slice(0, 150) + '...'
                    : sub.roast}
                </p>

                <div className="flex gap-3">
                  <Link
                    to={`/result/${sub.id}`}
                    className="text-orange-400 hover:underline font-medium"
                  >
                    See full roast →
                  </Link>
                  <button
                    onClick={() => toggleExpand(sub.id)}
                    className="text-gray-400 hover:text-white font-medium"
                  >
                    {expandedId === sub.id ? 'Hide comments ↑' : 'Comments ↓'}
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedId === sub.id && (
                <div className="p-4 bg-gray-850 border-t border-gray-700 space-y-4">
                  {/* Existing comments */}
                  {(comments[sub.id] || []).length > 0 && (
                    <div className="space-y-2">
                      {(comments[sub.id] || []).map((c) => (
                        <div key={c.id} className="bg-gray-700 p-3 rounded text-sm">
                          <span className="text-purple-400 font-medium">{c.authorName}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                          <p className="text-gray-300 mt-1">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder="Your name..."
                      maxLength={50}
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Leave a comment..."
                      maxLength={500}
                      rows={2}
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => submitComment(sub.id)}
                      disabled={!newComment.trim() || !commentAuthor.trim()}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
