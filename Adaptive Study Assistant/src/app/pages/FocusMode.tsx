import { useState, useEffect } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Moon, Sun, Leaf, Waves } from 'lucide-react';

type AmbientSound = {
  id: string;
  name: string;
  icon: typeof Music;
  color: string;
};

const ambientSounds: AmbientSound[] = [
  { id: 'rain', name: 'Rain', icon: Waves, color: 'blue' },
  { id: 'forest', name: 'Forest', icon: Leaf, color: 'green' },
  { id: 'night', name: 'Night', icon: Moon, color: 'indigo' },
  { id: 'cafe', name: 'Café', icon: Music, color: 'amber' },
];

export default function FocusMode() {
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive) {
      interval = window.setInterval(() => {
        setTimer((t) => {
          const newTime = t + 1;
          if (newTime % 1800 === 0) {
            setShowBreakReminder(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDistraction = () => {
    setDistractionCount(distractionCount + 1);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} -m-6 p-12 transition-colors duration-500`}>
      <div className="max-w-5xl mx-auto">
        {/* Header with Dark Mode Toggle */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Focus Mode
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Distraction-free deep work environment
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-full ${
              darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-700'
            } shadow-lg hover:shadow-xl transition-all`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {/* Main Timer */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-3xl p-12 shadow-2xl mb-8 border-2`}>
          <div className="text-center mb-8">
            <div className={`text-8xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timer)}
            </div>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isActive ? 'Deep Focus Session Active' : 'Ready to focus?'}
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => setIsActive(!isActive)}
              className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              {isActive ? (
                <>
                  <Pause className="inline mb-1 mr-2" size={24} />
                  Pause
                </>
              ) : (
                <>
                  <Play className="inline mb-1 mr-2" size={24} />
                  Start Focus
                </>
              )}
            </button>
            <button
              onClick={() => {
                setTimer(0);
                setIsActive(false);
                setDistractionCount(0);
              }}
              className={`px-8 py-4 ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } rounded-xl font-bold transition-all`}
            >
              Reset
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-indigo-50'} rounded-xl p-4 text-center`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Session Time</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {Math.floor(timer / 60)}m
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-xl p-4 text-center`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Breaks Taken</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {Math.floor(timer / 1800)}
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-amber-50'} rounded-xl p-4 text-center`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Distractions</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {distractionCount}
              </p>
            </div>
          </div>
        </div>

        {/* Ambient Sounds */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-8 shadow-xl mb-8 border-2`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Ambient Sounds
            </h2>
            {selectedSound && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVolume(volume === 0 ? 50 : 0)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  {volume === 0 ? (
                    <VolumeX className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
                  ) : (
                    <Volume2 className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{volume}%</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {ambientSounds.map((sound) => {
              const Icon = sound.icon;
              const isSelected = selectedSound === sound.id;
              return (
                <button
                  key={sound.id}
                  onClick={() => setSelectedSound(isSelected ? null : sound.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `border-${sound.color}-500 bg-${sound.color}-50 ${darkMode ? 'bg-opacity-20' : ''} shadow-lg`
                      : `${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`
                  }`}
                >
                  <Icon
                    className={`mx-auto mb-2 ${
                      isSelected ? `text-${sound.color}-600` : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    size={32}
                  />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sound.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distraction Log */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-8 shadow-xl border-2`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distraction Awareness
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Caught yourself getting distracted? Click the button below to log it. Awareness is the first step to better focus.
          </p>
          <button
            onClick={handleDistraction}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            I Got Distracted (+1)
          </button>
        </div>

        {/* Break Reminder Modal */}
        {showBreakReminder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md shadow-2xl`}>
              <div className="text-center">
                <div className="text-6xl mb-4">☕</div>
                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Time for a Break!
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  You've been focusing for 30 minutes. Take a 5-minute break to rest your eyes and stretch.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBreakReminder(false);
                      setIsActive(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Take Break
                  </button>
                  <button
                    onClick={() => setShowBreakReminder(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'border-2 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className={`mt-8 ${
          darkMode
            ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-700'
            : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
        } border-2 rounded-xl p-6`}>
          <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            💡 Focus Tips
          </h3>
          <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>• Put your phone in another room or turn off notifications</li>
            <li>• Use ambient sounds to block out distractions</li>
            <li>• Take a 5-minute break every 30 minutes</li>
            <li>• Track distractions to become more aware of your patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
