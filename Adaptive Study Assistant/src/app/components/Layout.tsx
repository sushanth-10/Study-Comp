import { Outlet, Link, useLocation } from 'react-router';
import {
  Home,
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  Calendar,
  Smile,
  Focus,
  FileText,
  Flame,
  Network,
  Library,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/quiz', label: 'Adaptive Quiz', icon: Brain },
  { path: '/flashcards', label: 'Flashcards', icon: BookOpen },
  { path: '/timer', label: 'Pomodoro Timer', icon: Timer },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/planner', label: 'Study Planner', icon: Calendar },
  { path: '/mood', label: 'Mood Tracker', icon: Smile },
  { path: '/focus', label: 'Focus Mode', icon: Focus },
  { path: '/notes', label: 'Smart Notes', icon: FileText },
  { path: '/streak', label: 'Study Streak', icon: Flame },
  { path: '/concepts', label: 'Concept Mapper', icon: Network },
  { path: '/resources', label: 'Resources', icon: Library },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white shadow-xl overflow-hidden`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AdaptLearn
          </h1>
          <p className="text-sm text-gray-600 mt-1">Adaptive Study Assistant</p>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-120px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Study Level</p>
              <p className="font-bold text-indigo-600">Intermediate</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
