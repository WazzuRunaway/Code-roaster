import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCode } from '../services/api';

const languages = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'PHP', 'C#'];

export default function HomePage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submission = await submitCode(code, language);
      navigate(`/result/${submission.id}`);
    } catch {
      setError('Failed to submit code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-2">🔥 CodeRoast</h1>
      <p className="text-gray-400 text-center mb-8">Submit your worst code. Get roasted.</p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="w-full h-64 p-4 rounded bg-gray-800 border border-gray-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />

        {error && <p className="text-red-400 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold disabled:opacity-50 transition-colors"
        >
          {loading ? '🔥 Roasting...' : '🔥 Roast My Code!'}
        </button>
      </form>
    </div>
  );
}
