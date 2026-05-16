import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, CheckCircle } from 'lucide-react';

type TimerMode = 'focus' | 'short-break' | 'long-break';

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [currentTask, setCurrentTask] = useState('');

  const durations = {
    focus: focusDuration * 60,
    'short-break': shortBreakDuration * 60,
    'long-break': longBreakDuration * 60,
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);

      if (currentTask) {
        setCompletedTasks([...completedTasks, currentTask]);
        setCurrentTask('');
      }

      if (newSessions % 4 === 0) {
        setMode('long-break');
        setTimeLeft(durations['long-break']);
      } else {
        setMode('short-break');
        setTimeLeft(durations['short-break']);
      }
    } else {
      setMode('focus');
      setTimeLeft(durations.focus);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Pomodoro Timer</h1>
        <p className="text-gray-600">Focus for {focusDuration} minutes, then take a break</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3 justify-center mb-8">
        <button
          onClick={() => switchMode('focus')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'focus'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Brain className="inline mb-1 mr-2" size={20} />
          Focus
        </button>
        <button
          onClick={() => switchMode('short-break')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'short-break'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Coffee className="inline mb-1 mr-2" size={20} />
          Short Break
        </button>
        <button
          onClick={() => switchMode('long-break')}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'long-break'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Coffee className="inline mb-1 mr-2" size={20} />
          Long Break
        </button>
      </div>

      {/* Timer Circle */}
      <div className="relative w-80 h-80 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke={mode === 'focus' ? '#ef4444' : mode === 'short-break' ? '#10b981' : '#3b82f6'}
            strokeWidth="20"
            strokeDasharray={`${2 * Math.PI * 140}`}
            strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-7xl font-bold mb-2">{formatTime(timeLeft)}</p>
          <p className="text-xl text-gray-600 capitalize">{mode.replace('-', ' ')}</p>
        </div>
      </div>

      {/* Current Task Input */}
      {mode === 'focus' && !isRunning && (
        <div className="mb-6">
          <input
            type="text"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={toggleTimer}
          className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          {isRunning ? (
            <>
              <Pause className="inline mb-1 mr-2" size={24} />
              Pause
            </>
          ) : (
            <>
              <Play className="inline mb-1 mr-2" size={24} />
              Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <RotateCcw className="inline mb-1 mr-2" size={20} />
          Reset
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-8 py-4 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <Settings className="inline mb-1 mr-2" size={20} />
          Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 mb-6">
          <h3 className="font-bold text-lg mb-4">Timer Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Focus Duration (minutes)</label>
              <input
                type="number"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Short Break (minutes)</label>
              <input
                type="number"
                value={shortBreakDuration}
                onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                min="1"
                max="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Long Break (minutes)</label>
              <input
                type="number"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                min="1"
                max="60"
              />
            </div>
          </div>
        </div>
      )}

      {/* Session Counter */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Sessions Today</p>
          <p className="text-4xl font-bold text-red-600">{sessions}</p>
          <div className="flex gap-1 mt-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${
                  i < (sessions % 4) ? 'bg-red-500' : 'bg-red-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {4 - (sessions % 4)} until long break
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-1">Total Focus Time</p>
          <p className="text-4xl font-bold text-purple-600">{sessions * focusDuration}m</p>
          <p className="text-sm text-gray-600 mt-3">
            {(sessions * focusDuration / 60).toFixed(1)} hours
          </p>
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            Completed Today
          </h3>
          <div className="space-y-2">
            {completedTasks.map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-gray-700">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
        <h3 className="font-bold mb-2">💡 Pomodoro Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Focus completely during work sessions - no distractions!</li>
          <li>• Use breaks to rest your eyes and stretch</li>
          <li>• After 4 sessions, take a longer 15-30 minute break</li>
          <li>• Track what you accomplish in each session</li>
        </ul>
      </div>
    </div>
  );
}
