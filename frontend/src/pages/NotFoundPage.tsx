import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-orange-400">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-gray-400">
          This page got roasted so hard it disappeared.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded font-bold transition-colors"
        >
          🔥 Go Home
        </Link>
      </div>
    </div>
  );
}
