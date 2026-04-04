import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: '🏠 Home' },
  { to: '/roasted', label: '🔥 Recently Roasted' },
  { to: '/halloffame', label: '🏆 Hall of Shame' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-gray-800 p-4" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 sm:gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`font-bold transition-colors ${
                isActive
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-white hover:text-orange-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
