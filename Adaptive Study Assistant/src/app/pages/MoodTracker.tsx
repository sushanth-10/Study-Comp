import { useState } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Smile, Meh, Frown, TrendingUp, Brain, Battery, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type MoodEntry = {
  date: string;
  mood: number;
  energy: number;
  focus: number;
  stress: number;
  studyHours: number;
  notes: string;
};

const moodData: MoodEntry[] = [
  { date: '05/10', mood: 4, energy: 4, focus: 5, stress: 2, studyHours: 4.5, notes: 'Productive morning session' },
  { date: '05/11', mood: 5, energy: 5, focus: 5, stress: 1, studyHours: 5.2, notes: 'Great day!' },
  { date: '05/12', mood: 3, energy: 2, focus: 3, stress: 4, studyHours: 2.8, notes: 'Felt tired' },
  { date: '05/13', mood: 4, energy: 4, focus: 4, stress: 3, studyHours: 4.1, notes: 'Getting better' },
  { date: '05/14', mood: 5, energy: 4, focus: 5, stress: 2, studyHours: 5.5, notes: 'Excellent focus' },
  { date: '05/15', mood: 4, energy: 3, focus: 4, stress: 2, studyHours: 3.9, notes: 'Steady progress' },
  { date: '05/16', mood: 0, energy: 0, focus: 0, stress: 0, studyHours: 0, notes: '' },
];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number>(0);
  const [selectedEnergy, setSelectedEnergy] = useState<number>(0);
  const [selectedFocus, setSelectedFocus] = useState<number>(0);
  const [selectedStress, setSelectedStress] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const getMoodEmoji = (value: number) => {
    if (value === 0) return '❓';
    if (value <= 2) return '😢';
    if (value <= 3) return '😐';
    if (value <= 4) return '🙂';
    return '😊';
  };

  const handleSubmit = async () => {
    if (selectedMood === 0 || selectedEnergy === 0 || selectedFocus === 0 || selectedStress === 0) {
      return;
    }
    const moods = ['', 'Great', 'Good', 'Okay', 'Low', 'Stressed'];
    try {
      await api.createMood({
        mood: moods[selectedMood] || 'Okay',
        energy: selectedEnergy,
        focus: selectedFocus,
        stress: selectedStress,
        notes: notes || undefined,
      });
      toast.success('Mood logged!');
    } catch {
      toast.error('Failed to save mood');
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedMood(0);
      setSelectedEnergy(0);
      setSelectedFocus(0);
      setSelectedStress(0);
      setNotes('');
    }, 2000);
  };

  const avgMood = (moodData.slice(0, -1).reduce((acc, d) => acc + d.mood, 0) / 6).toFixed(1);
  const avgEnergy = (moodData.slice(0, -1).reduce((acc, d) => acc + d.energy, 0) / 6).toFixed(1);
  const avgFocus = (moodData.slice(0, -1).reduce((acc, d) => acc + d.focus, 0) / 6).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mood & Energy Tracker</h1>
        <p className="text-gray-600">Track how you feel and correlate with performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Mood (7 days)</p>
              <p className="text-3xl font-bold text-yellow-600">{avgMood}/5</p>
            </div>
            <div className="text-4xl">{getMoodEmoji(Number(avgMood))}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Energy</p>
              <p className="text-3xl font-bold text-green-600">{avgEnergy}/5</p>
            </div>
            <Battery className="text-green-600" size={40} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Focus</p>
              <p className="text-3xl font-bold text-purple-600">{avgFocus}/5</p>
            </div>
            <Brain className="text-purple-600" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Check-in */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6">How are you feeling today?</h2>

          {submitted ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-bold text-green-600">Check-in recorded!</p>
              <p className="text-gray-600 mt-2">Keep tracking for better insights</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mood */}
              <div>
                <label className="block font-bold mb-3">Mood {selectedMood > 0 && getMoodEmoji(selectedMood)}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedMood(value)}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                        selectedMood === value
                          ? 'border-yellow-500 bg-yellow-100 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="block font-bold mb-3">Energy Level</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedEnergy(value)}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                        selectedEnergy === value
                          ? 'border-green-500 bg-green-100 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Focus */}
              <div>
                <label className="block font-bold mb-3">Focus Ability</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedFocus(value)}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                        selectedFocus === value
                          ? 'border-purple-500 bg-purple-100 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress */}
              <div>
                <label className="block font-bold mb-3">Stress Level</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSelectedStress(value)}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                        selectedStress === value
                          ? 'border-red-500 bg-red-100 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold mb-3">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was your study session? Any insights?"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none h-24 resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                disabled={selectedMood === 0 || selectedEnergy === 0 || selectedFocus === 0 || selectedStress === 0}
              >
                Save Check-in
              </button>
            </div>
          )}
        </div>

        {/* Weekly Trends */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Weekly Trends</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={moodData.slice(0, -1)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis domain={[0, 5]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="mood" stroke="#eab308" strokeWidth={2} name="Mood" />
              <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy" />
              <Line type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={2} name="Focus" />
              <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Stress" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood-Performance Correlation */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Mood vs Study Performance</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={moodData.slice(0, -1)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis yAxisId="left" domain={[0, 5]} stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 6]} stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line yAxisId="left" type="monotone" dataKey="mood" stroke="#eab308" strokeWidth={3} name="Mood" />
            <Line yAxisId="right" type="monotone" dataKey="studyHours" stroke="#6366f1" strokeWidth={3} name="Study Hours" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Zap className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-lg mb-2">Patterns Detected</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Higher energy correlates with 35% better focus</li>
                <li>• You study 1.5h more on high-mood days</li>
                <li>• Stress peaks on days with less sleep</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-lg mb-2">Recommendations</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Schedule difficult tasks on high-energy mornings</li>
                <li>• Take breaks when stress level is above 3</li>
                <li>• Light exercise before studying may boost mood</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
