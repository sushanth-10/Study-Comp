import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Settings, Maximize2, Minimize2, Volume2, Leaf, Waves, Moon, Music, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../lib/api';
import { toast } from 'sonner';

type Tab = 'pomodoro' | 'deep';
type TimerMode = 'focus' | 'short-break' | 'long-break';

const AMBIENT_URLS: Record<string, string> = {
  rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  forest: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
};

export default function FocusSession() {
  const [tab, setTab] = useState<Tab>('pomodoro');
  const [immersive, setImmersive] = useState(false);
  const [todayStats, setTodayStats] = useState({ minutes_today: 0, sessions_today: 0 });

  // Pomodoro state
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const pomodoroStartRef = useRef<number>(0);

  // Deep focus state
  const [deepTime, setDeepTime] = useState(0);
  const [deepActive, setDeepActive] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const durations = {
    focus: focusDuration * 60,
    'short-break': shortBreakDuration * 60,
    'long-break': longBreakDuration * 60,
  };

  useEffect(() => {
    api.todayStats().then(setTodayStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'pomodoro') return;
    let interval: number | undefined;
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      handlePomodoroComplete();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft, tab]);

  useEffect(() => {
    if (tab !== 'deep') return;
    let interval: number | undefined;
    if (deepActive) {
      interval = window.setInterval(() => setDeepTime((t) => t + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [deepActive, tab]);

  useEffect(() => {
    if (selectedSound && AMBIENT_URLS[selectedSound]) {
      if (!audioRef.current) audioRef.current = new Audio(AMBIENT_URLS[selectedSound]);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [selectedSound]);

  const saveSession = async (type: string, durationSec: number, dist = 0) => {
    try {
      await api.createSession({ session_type: type, duration_sec: durationSec, topic: currentTask || undefined, distractions: dist });
      const stats = await api.todayStats();
      setTodayStats(stats);
    } catch {
      toast.error('Could not save session');
    }
  };

  const handlePomodoroComplete = async () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const elapsed = focusDuration * 60;
      await saveSession('pomodoro', elapsed);
      const newSessions = sessions + 1;
      setSessions(newSessions);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('Focus session complete!');
      if (newSessions % 4 === 0) {
        setMode('long-break');
        setTimeLeft(longBreakDuration * 60);
      } else {
        setMode('short-break');
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const endDeepFocus = async () => {
    if (deepTime > 60) {
      await saveSession('focus', deepTime, distractions);
      toast.success(`Saved ${Math.floor(deepTime / 60)} min deep focus session`);
    }
    setDeepActive(false);
    setDeepTime(0);
    setDistractions(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDeep = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = tab === 'pomodoro' ? ((durations[mode] - timeLeft) / durations[mode]) * 100 : 0;
  const bg = immersive ? 'bg-[#0a0a0f]' : 'bg-transparent';

  return (
    <div className={`${bg} ${immersive ? 'fixed inset-0 z-50 p-8 overflow-auto' : ''} transition-all`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Focus Session</h1>
            <p className="text-gray-400">Pomodoro cycles or uninterrupted deep work</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setImmersive(!immersive)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10">
              {immersive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
          {(['pomodoro', 'deep'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setIsRunning(false); setDeepActive(false); }}
              className={`px-6 py-2 rounded-lg font-medium capitalize transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t === 'pomodoro' ? 'Pomodoro' : 'Deep Focus'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
            {tab === 'pomodoro' ? (
              <>
                <div className="flex gap-2 justify-center mb-6 flex-wrap">
                  {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => (
                    <button key={m} onClick={() => { setMode(m); setTimeLeft(durations[m]); setIsRunning(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                      {m.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <div className="relative w-64 h-64 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="128" cy="128" r="110" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                    <circle cx="128" cy="128" r="110" fill="none" stroke="#818cf8" strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 110} strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-white">{formatTime(timeLeft)}</p>
                    <p className="text-gray-400 capitalize">{mode.replace('-', ' ')}</p>
                  </div>
                </div>
                {mode === 'focus' && !isRunning && (
                  <input value={currentTask} onChange={(e) => setCurrentTask(e.target.value)} placeholder="What are you working on?"
                    className="w-full mb-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500" />
                )}
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setIsRunning(!isRunning)} className="px-8 py-3 bg-indigo-600 rounded-xl text-white font-semibold flex items-center gap-2">
                    {isRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
                  </button>
                  <button onClick={() => { setIsRunning(false); setTimeLeft(durations[mode]); }} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300">
                    <RotateCcw size={20} />
                  </button>
                  <button onClick={() => setShowSettings(!showSettings)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300">
                    <Settings size={20} />
                  </button>
                </div>
                {showSettings && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div><label className="text-xs text-gray-400">Focus (min)</label>
                      <input type="number" value={focusDuration} onChange={(e) => setFocusDuration(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white" /></div>
                    <div><label className="text-xs text-gray-400">Short break</label>
                      <input type="number" value={shortBreakDuration} onChange={(e) => setShortBreakDuration(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white" /></div>
                    <div><label className="text-xs text-gray-400">Long break</label>
                      <input type="number" value={longBreakDuration} onChange={(e) => setLongBreakDuration(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-white" /></div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-center py-8">
                  <p className="text-6xl font-bold text-white mb-4 font-mono">{formatDeep(deepTime)}</p>
                  <p className="text-gray-400 mb-6">Distraction-free deep work</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={() => setDeepActive(!deepActive)} className="px-8 py-3 bg-indigo-600 rounded-xl text-white font-semibold">
                      {deepActive ? 'Pause' : 'Start'} Session
                    </button>
                    {deepTime > 0 && (
                      <button onClick={endDeepFocus} className="px-6 py-3 bg-green-600/80 rounded-xl text-white">End & Save</button>
                    )}
                    <button onClick={() => setDistractions((d) => d + 1)} className="px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
                      <AlertCircle size={18} /> Distracted ({distractions})
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 justify-center mt-4">
                  {[{ id: 'rain', icon: Waves, name: 'Rain' }, { id: 'forest', icon: Leaf, name: 'Forest' }].map((s) => (
                    <button key={s.id} onClick={() => setSelectedSound(selectedSound === s.id ? null : s.id)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedSound === s.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                      <s.icon size={16} /> {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Today</p>
              <p className="text-2xl font-bold text-white">{Math.round(todayStats.minutes_today)} min</p>
              <p className="text-gray-500 text-sm">{todayStats.sessions_today} sessions</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-gray-400 text-sm">Pomodoro cycles</p>
              <p className="text-2xl font-bold text-indigo-400">{sessions}</p>
              <div className="flex gap-1 mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < sessions % 4 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
