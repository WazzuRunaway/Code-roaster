import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import FlipMove from 'react-flip-move';
import { getHallOfShame, likeSubmission, getComments, addComment } from '../services/api';
import type { Submission, Comment } from '../types';

interface CommentFormState {
  authorName: string;
  text: string;
}

export default function HallOfShamePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentForms, setCommentForms] = useState<Record<string, CommentFormState>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Poll every 10 seconds for real-time updates from other devices
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await getHallOfShame();
      setSubmissions(data);
    } catch {
      setError('Failed to load Hall of Shame');
    }
  }, []);

  useEffect(() => {
    fetchSubmissions().finally(() => setLoading(false));

    // Poll every 10 seconds for updates from other devices
    pollRef.current = setInterval(fetchSubmissions, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchSubmissions]);

  const handleLike = useCallback(async (id: string) => {
    if (likedIds.has(id)) return;
    try {
      const { likes } = await likeSubmission(id);
      setLikedIds((prev) => new Set(prev).add(id));
      // Trigger re-sort by creating new array
      setSubmissions((prev) => {
        const updated = prev.map((s) => (s.id === id ? { ...s, likes } : s));
        return [...updated].sort((a, b) => b.likes - a.likes);
      });
    } catch {
      // Silently fail
    }
  }, [likedIds]);

  const loadComments = useCallback(async (id: string) => {
    if (comments[id]) return;
    try {
      const data = await getComments(id);
      setComments((prev) => ({ ...prev, [id]: data }));
    } catch {
      // Silently fail
    }
  }, [comments]);

  const toggleExpand = useCallback(async (id: string) => {
    setExpandedId((prev) => {
      if (prev === id) return null;
      loadComments(id);
      return id;
    });
  }, [loadComments]);

  const updateCommentForm = useCallback((id: string, updates: Partial<CommentFormState>) => {
    setCommentForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { authorName: '', text: '' }), ...updates },
    }));
  }, []);

  const submitComment = useCallback(async (id: string) => {
    const form = commentForms[id] || { authorName: '', text: '' };
    if (!form.text.trim() || !form.authorName.trim()) return;

    try {
      const comment = await addComment(id, form.authorName.trim(), form.text.trim());
      setComments((prev) => ({
        ...prev,
        [id]: [comment, ...(prev[id] || [])],
      }));
      updateCommentForm(id, { authorName: form.authorName, text: '' });
    } catch {
      // Silently fail
    }
  }, [commentForms, updateCommentForm]);

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
      <p className="text-gray-400 text-center mb-8">Today's top roasts — resets at midnight</p>

      {submissions.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <p className="text-4xl mb-4">🏗️</p>
          <p className="text-xl font-bold text-gray-400 mb-2">Hall of Shame is empty today</p>
          <p className="text-gray-500 mb-4">
            Today's leaderboard is empty. The Hall of Shame resets every midnight.
          </p>
          <Link to="/" className="text-orange-400 hover:underline mt-4 inline-block">
            Submit code and get featured →
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <FlipMove duration={600} easing="cubic-bezier(0.25, 0.1, 0.25, 1)">
            {submissions.map((sub, idx) => (
              <div key={sub.id} className="bg-gray-800 rounded-lg overflow-hidden transition-shadow hover:shadow-lg hover:shadow-orange-500/10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 border-b border-gray-700">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`font-bold text-center inline-block ${
                      idx === 0 ? 'text-3xl text-yellow-400 w-12' :
                      idx === 1 ? 'text-2xl text-gray-300 w-12' :
                      idx === 2 ? 'text-2xl text-orange-400 w-10' :
                      'text-lg text-gray-500 w-10'
                    }`}>
                      #{idx + 1}
                    </span>
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
                  <button
                    onClick={() => handleLike(sub.id)}
                    disabled={likedIds.has(sub.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 shrink-0 self-start sm:self-auto ${
                      likedIds.has(sub.id)
                        ? 'bg-red-900 border-2 border-red-700 cursor-not-allowed shadow-lg shadow-red-900/50'
                        : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
                    }`}
                    aria-label={`Like this submission. Current likes: ${sub.likes}`}
                  >
                    <span className={`text-xl transition-transform duration-300 ${
                      likedIds.has(sub.id) ? 'scale-125' : ''
                    }`}>
                      {likedIds.has(sub.id) ? '❤️‍🔥' : '🔥'}
                    </span>
                    <span className="font-bold">{sub.likes}</span>
                  </button>
                </div>

                {/* Content */}
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
                  <div className="p-4 bg-gray-800/50 border-t border-gray-700 space-y-4">
                    {comments[sub.id] === undefined ? (
                      <p className="text-gray-500 text-sm">Loading comments...</p>
                    ) : (comments[sub.id] || []).length > 0 ? (
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
                    ) : (
                      <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
                    )}

                    {/* Comment Form */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={commentForms[sub.id]?.authorName || ''}
                        onChange={(e) => updateCommentForm(sub.id, { authorName: e.target.value })}
                        placeholder="Your name..."
                        maxLength={50}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <textarea
                        value={commentForms[sub.id]?.text || ''}
                        onChange={(e) => updateCommentForm(sub.id, { text: e.target.value })}
                        placeholder="Leave a comment..."
                        maxLength={500}
                        rows={2}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => submitComment(sub.id)}
                        disabled={!commentForms[sub.id]?.text?.trim() || !commentForms[sub.id]?.authorName?.trim()}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </FlipMove>
        </div>
      )}
    </div>
  );
}
