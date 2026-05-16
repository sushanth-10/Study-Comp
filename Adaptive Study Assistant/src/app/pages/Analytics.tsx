import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Target, Brain, Award, Calendar } from 'lucide-react';
import { api, AnalyticsData } from '../../lib/api';

const defaultWeekly = [
  { day: 'Mon', hours: 3.5, accuracy: 85, topics: 4 },
  { day: 'Tue', hours: 4.2, accuracy: 88, topics: 5 },
  { day: 'Wed', hours: 2.8, accuracy: 82, topics: 3 },
  { day: 'Thu', hours: 5.1, accuracy: 91, topics: 6 },
  { day: 'Fri', hours: 3.9, accuracy: 87, topics: 5 },
  { day: 'Sat', hours: 6.2, accuracy: 93, topics: 7 },
  { day: 'Sun', hours: 4.5, accuracy: 89, topics: 5 },
];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  useEffect(() => { api.getAnalytics().then(setData).catch(() => {}); }, []);

  const weeklyData = data?.weekly_data || defaultWeekly;
  const subjectPerformance = data?.subject_performance || [{ subject: 'General', score: 0, fullMark: 100 }];
  const timeOfDayData = (data?.time_of_day_data || []).map(d => ({ time: d.hour, focus: d.focus, retention: d.retention }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-gray-600">Detailed insights into your learning patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-600" size={24} />
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-sm text-gray-600">Avg Study Time</p>
          <p className="text-3xl font-bold text-blue-600">{data?.total_hours ?? 0}h</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-green-600" size={24} />
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-sm text-gray-600">Avg Accuracy</p>
          <p className="text-3xl font-bold text-green-600">{data?.avg_accuracy ?? 0}%</p>
          <p className="text-xs text-green-600 mt-1">↑ 5% from last week</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Brain className="text-purple-600" size={24} />
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-sm text-gray-600">Topics Studied</p>
          <p className="text-3xl font-bold text-purple-600">{data?.topics_studied ?? 0}</p>
          <p className="text-xs text-green-600 mt-1">↑ 8 new this week</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-amber-600" size={24} />
            <Calendar className="text-amber-600" size={20} />
          </div>
          <p className="text-sm text-gray-600">Current Streak</p>
          <p className="text-3xl font-bold text-amber-600">{data?.streak_days ?? 0}</p>
          <p className="text-xs text-gray-600 mt-1">days in a row</p>
        </div>
      </div>

      {/* Weekly Study Hours */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Weekly Study Hours</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="hours" fill="#8b5cf6" name="Hours Studied" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">Accuracy Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[70, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                name="Accuracy %"
                dot={{ fill: '#10b981', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">Subject Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={subjectPerformance}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time of Day Performance */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Performance by Time of Day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeOfDayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="focus"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Focus Level"
              dot={{ fill: '#3b82f6', r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="retention"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Retention Rate"
              dot={{ fill: '#8b5cf6', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="font-bold text-lg mb-2">Strengths</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Morning study sessions show 23% better retention</li>
                <li>• Consistent improvement in Math and Physics</li>
                <li>• Strong focus during 9 AM - 12 PM window</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-bold text-lg mb-2">Recommendations</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Schedule challenging topics before noon</li>
                <li>• Chemistry needs more practice - consider extra review</li>
                <li>• Avoid studying during 12-3 PM (low focus period)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Style Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Your Learning Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Preferred Study Duration</p>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: '75%' }} />
            </div>
            <p className="text-sm font-bold mt-1">45-60 minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Best Learning Time</p>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '92%' }} />
            </div>
            <p className="text-sm font-bold mt-1">9-11 AM (92% focus)</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Response Speed</p>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '68%' }} />
            </div>
            <p className="text-sm font-bold mt-1">Moderate (deliberate)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
