import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, Book, CheckCircle2, Circle, Trash2 } from 'lucide-react';

type StudyTask = {
  id: number;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
};

const initialTasks: StudyTask[] = [
  {
    id: 1,
    title: 'Review Calculus - Derivatives',
    subject: 'Mathematics',
    date: '2026-05-16',
    time: '09:00',
    duration: 60,
    completed: false,
    priority: 'high'
  },
  {
    id: 2,
    title: 'Practice Organic Chemistry',
    subject: 'Chemistry',
    date: '2026-05-16',
    time: '14:00',
    duration: 45,
    completed: false,
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Read Physics Chapter 7',
    subject: 'Physics',
    date: '2026-05-17',
    time: '10:00',
    duration: 90,
    completed: false,
    priority: 'high'
  },
  {
    id: 4,
    title: 'English Essay Draft',
    subject: 'English',
    date: '2026-05-17',
    time: '15:00',
    duration: 120,
    completed: false,
    priority: 'high'
  },
  {
    id: 5,
    title: 'Biology Flashcards',
    subject: 'Biology',
    date: '2026-05-18',
    time: '11:00',
    duration: 30,
    completed: false,
    priority: 'low'
  },
];

export default function StudyPlanner() {
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    date: '2026-05-16',
    time: '09:00',
    duration: 60,
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.subject) return;

    const task: StudyTask = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      ...newTask,
      completed: false
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      subject: '',
      date: '2026-05-16',
      time: '09:00',
      duration: 60,
      priority: 'medium'
    });
    setShowAddForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, StudyTask[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date('2026-05-16');
    const tomorrow = new Date('2026-05-17');

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const totalStudyTime = tasks.reduce((acc, task) => acc + task.duration, 0);
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-gray-600">Organize your study sessions</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
        >
          <Plus className="inline mb-1 mr-2" size={20} />
          Add Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold">{tasks.length}</p>
            </div>
            <Book className="text-indigo-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold">{completedCount}/{tasks.length}</p>
            </div>
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Time</p>
              <p className="text-3xl font-bold">{(totalStudyTime / 60).toFixed(1)}h</p>
            </div>
            <Clock className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-indigo-200 mb-6">
          <h3 className="font-bold text-lg mb-4">New Study Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Task Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Review Calculus Chapter 5"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                placeholder="e.g., Mathematics"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={newTask.duration}
                onChange={(e) => setNewTask({ ...newTask, duration: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                min="15"
                step="15"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addTask}
              className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Add Task
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 border-2 border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tasks by Date */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).sort().map(([date, dateTasks]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <CalendarIcon size={20} className="text-indigo-600" />
              <h3 className="text-xl font-bold">{formatDate(date)}</h3>
              <span className="text-sm text-gray-600">
                {dateTasks.filter(t => !t.completed).length} pending
              </span>
            </div>

            <div className="space-y-3">
              {dateTasks.sort((a, b) => a.time.localeCompare(b.time)).map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl p-5 shadow-md border-l-4 ${getPriorityColor(task.priority)} ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="text-green-600" size={24} />
                      ) : (
                        <Circle className="text-gray-400 hover:text-indigo-500 transition-colors" size={24} />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-bold text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Book size={16} />
                              {task.subject}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={16} />
                              {task.time} ({task.duration}min)
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="text-red-500" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          💡 Planning Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Schedule high-priority tasks during your peak focus hours (check Analytics)</li>
          <li>• Break large tasks into smaller 45-60 minute sessions</li>
          <li>• Leave buffer time between sessions for breaks</li>
          <li>• Review and adjust your plan at the end of each day</li>
        </ul>
      </div>
    </div>
  );
}
