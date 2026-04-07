import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCode } from '../services/api';

const languages = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart',
  'R', 'MATLAB', 'Scala', 'Perl', 'Lua', 'Haskell',
  'Shell', 'PowerShell', 'SQL', 'HTML/CSS', 'React',
];
const spicinessLevels = [
  { value: 'mild', label: '🌶️ Baby Spice', desc: 'Gentle' },
  { value: 'medium', label: '🌶️🌶️ Code Salsa', desc: 'Feeling it' },
  { value: 'hot', label: '🌶️🌶️🌶️ Inferno', desc: 'Savage' },
];

const funPlaceholders = [
  '// Paste your worst code here...\n// (we promise not to judge... much)',
  '// Got code that keeps you up at night?\n// Drop it here 🔥',
  '// var x = 1; var y = 2; var z = x + y;\n// We\'ve all been there. Show us.',
  '// That one function nobody dares to touch?\n// Yeah, this one.',
  '// 500 lines of if-else?\n// We\'re ready. Bring it on.',
  '// Code that works but nobody knows why?\n// Perfect candidate.',
  '// Stack Overflow copy-paste special?\n// We won\'t tell anyone.',
  '// Wrote this at 3 AM before deadline?\n// We\'ve all been there.',
  '// "It works on my machine" energy?\n// Let\'s see the damage.',
  '// Your professor asked for clean code?\n// Good luck with that.',
  '// This function has 47 parameters?\n// Bold strategy.',
  '// Commented out code "just in case"?\n// We found it.',
  '// Variables named a, b, c, aa, ab?\n// Classic naming convention.',
  '// One giant function to rule them all?\n// The spaghetti is real.',
  '// You inherited this codebase?\n// Our condolences. Show us.',
  '// "Temporary hack" from 2019?\n// Nothing is permanent.',
  '// console.log() debugging at its finest?\n// Respect.',
  '// 12 nested for-loops? We lost count.\n// Show us the abomination.',
  '// "I\'ll refactor later" - said no one ever?\n// Today is that day.',
  '// Code so clever even you don\'t get it?\n// Let\'s fix that.',
];

const MAX_CODE_LENGTH = 50000;

export default function HomePage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0]);
  const [spiciness, setSpiciness] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Rotate placeholders every 4s, pause when focused
  useEffect(() => {
    if (isFocused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % funPlaceholders.length);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length > MAX_CODE_LENGTH) {
      setError('Code is too long (max 50KB)');
      return;
    }

    setLoading(true);
    try {
      const submission = await submitCode(code, language, spiciness);
      navigate(`/result/${submission.id}`);
    } catch {
      setError('The roast got stuck in the oven. Try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-5xl font-bold text-center mb-2">🔥 CodeRoast</h1>
      <p className="text-gray-400 text-center mb-8">Submit your worst code. Get roasted.</p>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        {/* Language Selector - custom animated dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer transition-all duration-300 flex items-center justify-between hover:border-orange-500"
          >
            <span>{language}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                isLangOpen ? 'rotate-180' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          <div
            className={`absolute z-10 w-full mt-1 rounded bg-gray-800 border border-gray-700 shadow-xl overflow-y-auto transition-all duration-300 origin-top custom-scrollbar ${
              isLangOpen
                ? 'opacity-100 scale-y-100 max-h-60'
                : 'opacity-0 scale-y-0 max-h-0 pointer-events-none'
            }`}
          >
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLanguage(lang);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 transition-colors duration-150 ${
                    language === lang
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

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

        {/* Code Input */}
        <div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
            placeholder={funPlaceholders[placeholderIdx]}
            maxLength={MAX_CODE_LENGTH}
            className="w-full h-64 p-4 rounded bg-gray-800 border border-gray-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>{code.length.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()} characters</span>
            {code.length > MAX_CODE_LENGTH * 0.9 && <span>⚠️ Almost at limit</span>}
          </div>
        </div>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold disabled:opacity-50 transition-colors relative overflow-hidden"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI is thinking...
            </span>
          ) : (
            '🔥 Roast My Code!'
          )}
        </button>
      </form>
    </div>
  );
}
