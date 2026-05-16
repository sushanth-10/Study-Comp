import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Home, Brain, Timer, BarChart3, Calendar, Smile, FileText, Flame, Network, Library, LogOut, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/quiz', label: 'Quiz', icon: Brain },
  { path: '/focus', label: 'Focus', icon: Timer },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/planner', label: 'Planner', icon: Calendar },
  { path: '/mood', label: 'Mood', icon: Smile },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/streak', label: 'Streak', icon: Flame },
  { path: '/concepts', label: 'Concepts', icon: Network },
  { path: '/resources', label: 'Resources', icon: Library },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col">
      {/* Hero Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0f12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AdaptLearn
              </h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl py-1 z-50">
                  <p className="px-4 py-2 text-xs text-gray-500 truncate">{user?.email}</p>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5">
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="md:hidden flex gap-1 mt-3 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
