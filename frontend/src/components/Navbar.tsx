import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-6xl mx-auto flex gap-4">
        <Link to="/" className="text-white font-bold">🏠 Home</Link>
        <Link to="/feed" className="text-white font-bold">🏆 Hall of Shame</Link>
      </div>
    </nav>
  );
}
