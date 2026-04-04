import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCode } from '../services/api';

const languages = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'PHP', 'C#'];
const spicinessLevels = [
  { value: 'mild', label: '🌶️ Mild', desc: 'Gentle' },
  { value: 'medium', label: '🌶️🌶️ Medium', desc: 'Balanced' },
  { value: 'hot', label: '🌶️🌶️🌶️ Hot', desc: 'Savage' },
];

export default function HomePage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0]);
  const [spiciness, setSpiciness] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const submission = await submitCode(code, language, spiciness);
      navigate(`/result/${submission.id}`);
    } catch {
      setError('Failed to submit code. Make sure Ollama is running.');
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

        {/* Spiciness Selector */}
        <div className="flex gap-3 justify-center">
          {spicinessLevels.map((level) => (
            <label
              key={level.value}
              className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                spiciness === level.value
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="spiciness"
                value={level.value}
                checked={spiciness === level.value}
                onChange={(e) => setSpiciness(e.target.value)}
                className="hidden"
              />
              <div className="text-lg">{level.label}</div>
              <div className="text-xs text-gray-400">{level.desc}</div>
            </label>
          ))}
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const newValue = code.slice(0, start) + '  ' + code.slice(end);
              setCode(newValue);
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              }, 0);
            }
          }}
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
