import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { TrendingUp, Clock, BookOpen, Target, Zap, Award, Brain, ArrowRight } from 'lucide-react';
import { api, DashboardData } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: 'Study Streak', value: `${data.streak_days} days`, icon: TrendingUp, color: 'from-orange-400 to-red-400' },
    { label: 'Hours Today', value: `${data.hours_today}h`, icon: Clock, color: 'from-blue-400 to-cyan-400' },
    { label: 'Topics Mastered', value: String(data.topics_mastered), icon: BookOpen, color: 'from-green-400 to-emerald-400' },
    { label: 'Accuracy Rate', value: `${data.accuracy_rate}%`, icon: Target, color: 'from-purple-400 to-pink-400' },
  ] : [];

  const quickActions = [
    { title: 'Start Adaptive Quiz', desc: 'AI adjusts to your performance', path: '/quiz', icon: Brain, color: 'indigo' },
    { title: 'Focus Session', desc: 'Pomodoro & deep focus modes', path: '/focus', icon: Zap, color: 'amber' },
    { title: 'Check Analytics', desc: 'View detailed performance', path: '/analytics', icon: Award, color: 'green' },
    { title: 'Study Streak', desc: 'Track your consistency', path: '/streak', icon: TrendingUp, color: 'purple' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-40 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur border border-white/10 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.username || 'Student'}!</h2>
        <p className="text-indigo-100">Ready to continue your learning journey?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition group">
                <Icon className="text-indigo-400 mb-4" size={28} />
                <h4 className="font-bold text-white mb-1">{action.title}</h4>
                <p className="text-sm text-gray-400">{action.desc}</p>
                <div className="flex items-center gap-2 mt-4 text-indigo-400 text-sm font-medium">
                  Start now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 text-white">Recent Activity</h3>
        <div className="space-y-3">
          {(data?.recent_activity || []).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {activity.subject[0]}
                </div>
                <div>
                  <p className="font-bold text-white">{activity.subject}</p>
                  <p className="text-sm text-gray-400">{activity.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${activity.progress}%` }} />
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
        <h4 className="font-bold text-lg mb-2 text-amber-200">AI Learning Insight</h4>
        <p className="text-gray-300">{data?.ai_insight}</p>
        <Link to="/analytics" className="inline-flex items-center gap-2 mt-3 text-amber-400 text-sm font-medium">
          View detailed analytics <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
