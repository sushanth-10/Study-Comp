import { Link } from 'react-router';
import {
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  Zap,
  Award,
  Brain,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Study Streak', value: '12 days', icon: TrendingUp, color: 'from-orange-400 to-red-400' },
    { label: 'Hours Today', value: '3.5h', icon: Clock, color: 'from-blue-400 to-cyan-400' },
    { label: 'Topics Mastered', value: '24', icon: BookOpen, color: 'from-green-400 to-emerald-400' },
    { label: 'Accuracy Rate', value: '87%', icon: Target, color: 'from-purple-400 to-pink-400' },
  ];

  const recentActivity = [
    { subject: 'Mathematics', topic: 'Calculus - Derivatives', progress: 85, time: '2h ago' },
    { subject: 'Physics', topic: 'Quantum Mechanics', progress: 65, time: '5h ago' },
    { subject: 'Chemistry', topic: 'Organic Reactions', progress: 92, time: 'Yesterday' },
  ];

  const quickActions = [
    { title: 'Start Adaptive Quiz', desc: 'AI adjusts to your performance', path: '/quiz', icon: Brain, color: 'indigo' },
    { title: 'Review Flashcards', desc: 'Spaced repetition system', path: '/flashcards', icon: BookOpen, color: 'purple' },
    { title: 'Focus Session', desc: 'Pomodoro timer with breaks', path: '/timer', icon: Zap, color: 'amber' },
    { title: 'Check Analytics', desc: 'View detailed performance', path: '/analytics', icon: Award, color: 'green' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Student!</h2>
        <p className="text-indigo-100">Ready to continue your learning journey? Let's make today count!</p>
        <div className="mt-6 flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-sm opacity-90">Current Energy Level</p>
            <p className="font-bold text-xl">🔥 High Focus</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-sm opacity-90">Recommended</p>
            <p className="font-bold text-xl">Challenging Topics</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-${action.color}-100 flex items-center justify-center mb-4`}>
                  <Icon className={`text-${action.color}-600`} size={24} />
                </div>
                <h4 className="font-bold mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.desc}</p>
                <div className="flex items-center gap-2 mt-4 text-indigo-600 font-medium">
                  <span className="text-sm">Start now</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {activity.subject[0]}
                  </div>
                  <div>
                    <p className="font-bold">{activity.subject}</p>
                    <p className="text-sm text-gray-600">{activity.topic}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-bold">{activity.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${activity.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 w-20">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-2xl">
            💡
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-2">AI Learning Insight</h4>
            <p className="text-gray-700">
              You perform <span className="font-bold text-amber-700">23% better</span> in the morning. Your response speed drops after 45 minutes - try shorter study sessions with breaks.
            </p>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-2 mt-3 text-amber-700 font-medium hover:text-amber-800"
            >
              View detailed analytics
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
