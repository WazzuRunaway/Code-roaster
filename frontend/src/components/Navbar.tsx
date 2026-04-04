import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-6xl mx-auto flex gap-6">
        <Link to="/" className="text-white font-bold hover:text-orange-400 transition-colors">🏠 Home</Link>
        <Link to="/roasted" className="text-white font-bold hover:text-orange-400 transition-colors">🔥 Recently Roasted</Link>
        <Link to="/halloffame" className="text-white font-bold hover:text-orange-400 transition-colors">🏆 Hall of Fame</Link>
      </div>
    </nav>
  );
}
