import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { getSubmission, publishSubmission } from '../services/api';
import type { Submission } from '../types';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getSubmission(id)
        .then((data) => {
          setSubmission(data);
          if (data.isPublic) setShared(true);
        })
        .catch(() => setError('Failed to load submission'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleShare = useCallback(async () => {
    if (!authorName.trim() || !id) return;
    setShareError('');
    setSharing(true);
    try {
      const updated = await publishSubmission(id, authorName.trim().slice(0, 50));
      setSubmission(updated);
      setShared(true);
    } catch {
      setShareError('Failed to share. Try again.');
    } finally {
      setSharing(false);
    }
  }, [authorName, id]);

  const handleCopySolution = useCallback(async () => {
    if (!submission?.solution) return;
    await navigator.clipboard.writeText(submission.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [submission?.solution]);

  const spiceLabel = (score: number) => {
    if (score >= 80) return '🍝🍝🍝 Maximum Spaghetti';
    if (score >= 60) return '🍝🍝 Pretty Tangled';
    if (score >= 40) return '🍝 A Bit Messy';
    return '🍽️ Surprisingly Clean';
  };

  const spiceColor = (score: number) => {
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🔥 The Roast Is In!</h1>
          <div className="flex justify-center gap-3 flex-wrap">
            <span className="bg-orange-600 px-3 py-1 rounded text-sm">{submission.language}</span>
            <span className="bg-purple-600 px-3 py-1 rounded text-sm capitalize">
              {submission.spiciness}
            </span>
            {shared && <span className="bg-green-600 px-3 py-1 rounded text-sm">🌍 Shared publicly</span>}
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
              className={`h-4 rounded-full transition-all duration-500 ${spiceColor(submission.spaghettiScore)}`}
              style={{ width: `${submission.spaghettiScore}%` }}
            />
          </div>
          <p className="text-gray-400 mt-2 text-center">{spiceLabel(submission.spaghettiScore)}</p>
        </div>

        {/* Roast */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">💀 What You Did Wrong</h2>
          <div className="text-gray-300 leading-relaxed space-y-3">
            {submission.roast.split('\n').map((line, i) => (
              line.trim() ? <p key={i}>{line}</p> : <br key={i} />
            ))}
          </div>
        </div>

        {/* Solution */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">✅ How To Fix It</h2>
            <button
              onClick={handleCopySolution}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded border border-gray-600 hover:border-gray-400"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre className="bg-gray-950 p-4 rounded overflow-x-auto text-sm text-green-400 whitespace-pre-wrap break-words">
            <code>{submission.solution}</code>
          </pre>
        </div>

        {/* Share Section */}
        {!shared && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">🌍 Want to Share This?</h2>
            <p className="text-gray-400 mb-4">
              Put your name on this roast and add it to the Hall of Shame!
            </p>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name (or alias)..."
                maxLength={50}
                className="flex-1 min-w-[200px] p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleShare}
                disabled={sharing || !authorName.trim()}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {sharing ? '⏳ Sharing...' : '🔥 Share My Roast'}
              </button>
            </div>
            {shareError && <p className="text-red-400 mt-2">{shareError}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold transition-colors"
          >
            🔥 Submit Another
          </button>
          <button
            onClick={() => navigate('/roasted')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-bold transition-colors"
          >
            🍽️ See All Roasts
          </button>
        </div>
      </div>
    </div>
  );
}
