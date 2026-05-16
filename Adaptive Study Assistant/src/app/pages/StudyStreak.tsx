import { useEffect, useState } from 'react';
import { Flame, Trophy, Target, Award, Calendar, TrendingUp, Star, Zap } from 'lucide-react';
import { api, StreakData } from '../../lib/api';

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
};

const achievements: Achievement[] = [
  {
    id: 'week',
    title: '7 Day Streak',
    description: 'Study for 7 days in a row',
    icon: '🔥',
    unlocked: true
  },
  {
    id: 'month',
    title: '30 Day Streak',
    description: 'Study for 30 days in a row',
    icon: '💪',
    unlocked: false,
    progress: 12,
    total: 30
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Study before 8 AM for 5 days',
    icon: '🌅',
    unlocked: true
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Study after 10 PM for 5 days',
    icon: '🦉',
    unlocked: false,
    progress: 2,
    total: 5
  },
  {
    id: 'century',
    title: '100 Hours',
    description: 'Complete 100 hours of study',
    icon: '⏰',
    unlocked: false,
    progress: 67,
    total: 100
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Meet all daily goals for a week',
    icon: '✨',
    unlocked: true
  },
  {
    id: 'speed-learner',
    title: 'Speed Learner',
    description: 'Complete 20 topics in one day',
    icon: '⚡',
    unlocked: false,
    progress: 8,
    total: 20
  },
  {
    id: 'master',
    title: 'Subject Master',
    description: 'Achieve 95%+ in any subject',
    icon: '🎓',
    unlocked: true
  },
];

const calendarDays = Array.from({ length: 90 }, (_, i) => {
  const date = new Date('2026-02-15');
  date.setDate(date.getDate() + i);
  const hasStudied = i >= 90 - 12;
  const hours = hasStudied ? Math.floor(Math.random() * 6) + 1 : 0;
  return { date: date.toISOString().split('T')[0], hasStudied, hours };
});

export default function StudyStreak() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  useEffect(() => { api.getStreak().then(setStreakData).catch(() => {}); }, []);

  const currentStreak = streakData?.current_streak ?? 0;
  const longestStreak = streakData?.longest_streak ?? 0;
  const totalDays = streakData?.total_days ?? 0;
  const calendarDays = (streakData?.calendar_days || []).map(d => ({
    date: d.date,
    hasStudied: d.active,
    hours: d.hours,
  }));
  const achievements = streakData?.achievements || [];
  const todayMinutes = streakData?.today_minutes ?? 0;
  const dailyGoal = streakData?.daily_goal_minutes ?? 120;

  const getStreakColor = (hours: number) => {
    if (hours === 0) return 'bg-gray-100';
    if (hours < 2) return 'bg-green-200';
    if (hours < 4) return 'bg-green-400';
    if (hours < 6) return 'bg-green-600';
    return 'bg-green-800';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Study Streak</h1>
        <p className="text-gray-600">Keep your momentum going!</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-6xl opacity-20">🔥</div>
          <div className="relative z-10">
            <p className="text-sm text-gray-600 mb-2">Current Streak</p>
            <p className="text-6xl font-bold text-orange-600 mb-2">{currentStreak}</p>
            <p className="text-lg text-gray-700">days in a row</p>
            <div className="mt-4 flex items-center gap-2">
              <Flame className="text-orange-500" size={20} />
              <p className="text-sm font-medium">Keep it up!</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="text-purple-600" size={40} />
            <Award className="text-purple-400" size={32} />
          </div>
          <p className="text-sm text-gray-600 mb-2">Longest Streak</p>
          <p className="text-4xl font-bold text-purple-600 mb-2">{longestStreak} days</p>
          <p className="text-sm text-gray-600">Personal best!</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="text-blue-600" size={40} />
            <TrendingUp className="text-green-500" size={32} />
          </div>
          <p className="text-sm text-gray-600 mb-2">Total Study Days</p>
          <p className="text-4xl font-bold text-blue-600 mb-2">{totalDays}</p>
          <p className="text-sm text-gray-600">This year</p>
        </div>
      </div>

      {/* Motivation Message */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🎯</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">You're on fire!</h3>
            <p className="text-indigo-100">
              Just {longestStreak - currentStreak} more days to beat your personal best!
              Studies show that a 21-day streak forms a habit.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-xl transition-all">
            Study Now
          </button>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6">Study Activity</h2>
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="text-gray-600">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <div className="w-4 h-4 bg-green-800 rounded"></div>
          </div>
          <span className="text-gray-600">More</span>
        </div>
        <div className="grid grid-cols-13 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded ${getStreakColor(day.hours)}`}
              title={`${day.date}: ${day.hours}h`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">Last 90 days of activity</p>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Achievements</h2>
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" size={24} />
            <span className="font-bold text-xl">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-md'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h3 className="font-bold mb-1">{achievement.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>

                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${(achievement.progress / (achievement.target || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {achievement.progress}/{achievement.target}
                    </p>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="flex items-center justify-center gap-1 text-yellow-600">
                    <Zap className="fill-yellow-500" size={16} />
                    <span className="text-sm font-bold">Unlocked!</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Target className="text-green-600" size={32} />
            <div>
              <h3 className="font-bold text-lg">Today's Goal</h3>
              <p className="text-sm text-gray-600">Study for at least {dailyGoal} minutes</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{(todayMinutes / 60).toFixed(1)}h</p>
            <p className="text-sm text-gray-600">{Math.max(0, dailyGoal - todayMinutes)} min to go</p>
          </div>
        </div>
        <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${Math.min(100, (todayMinutes / dailyGoal) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
