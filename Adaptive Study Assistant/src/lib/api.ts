const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.detail || data.message || 'Request failed');
  }
  return data as T;
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  daily_goal_minutes: number;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  sendOtp: (email: string, purpose: string) =>
    request('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email, purpose }) }),

  verifyOtp: (email: string, code: string, purpose: string) =>
    request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, code, purpose }) }),

  register: (data: { email: string; username: string; password: string; otp_code: string }) =>
    request<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (identifier: string, password: string, remember_me = false) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, remember_me }),
    }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email: string, otp_code: string, new_password: string) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code, new_password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request<User>('/auth/me'),

  getDashboard: () => request<DashboardData>('/dashboard'),

  getAnalytics: () => request<AnalyticsData>('/analytics/summary'),

  getStreak: () => request<StreakData>('/streak'),

  createSession: (data: SessionCreate) =>
    request('/sessions', { method: 'POST', body: JSON.stringify(data) }),

  todayStats: () => request<{ minutes_today: number; sessions_today: number }>('/sessions/today-stats'),

  createQuizAttempt: (data: QuizAttemptCreate) =>
    request('/quiz-attempts', { method: 'POST', body: JSON.stringify(data) }),

  getNotes: () => request<NoteData[]>('/notes'),
  createNote: (data: Partial<NoteData>) =>
    request<NoteData>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: number, data: Partial<NoteData>) =>
    request<NoteData>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: number) => request(`/notes/${id}`, { method: 'DELETE' }),

  createMood: (data: MoodCreate) =>
    request('/mood', { method: 'POST', body: JSON.stringify(data) }),
  getMood: () => request<MoodEntry[]>(`/mood`),

  getPlanner: () => request<PlannerTask[]>('/planner'),
  createPlanner: (data: Partial<PlannerTask>) =>
    request<PlannerTask>('/planner', { method: 'POST', body: JSON.stringify(data) }),
  updatePlanner: (id: number, data: Partial<PlannerTask>) =>
    request<PlannerTask>(`/planner/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanner: (id: number) => request(`/planner/${id}`, { method: 'DELETE' }),
};

export interface DashboardData {
  streak_days: number;
  hours_today: number;
  topics_mastered: number;
  accuracy_rate: number;
  recent_activity: { subject: string; topic: string; progress: number; time: string }[];
  ai_insight: string;
  user: User;
}

export interface AnalyticsData {
  weekly_data: { day: string; hours: number; accuracy: number }[];
  subject_performance: { subject: string; score: number; fullMark: number }[];
  time_of_day_data: { hour: string; focus: number; retention: number }[];
  total_hours: number;
  avg_accuracy: number;
  topics_studied: number;
  streak_days: number;
  insights: string[];
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  calendar_days: { date: string; hours: number; active: boolean }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
    target: number;
  }[];
  today_minutes: number;
  daily_goal_minutes: number;
}

export interface SessionCreate {
  session_type: string;
  duration_sec: number;
  subject?: string;
  topic?: string;
  distractions?: number;
}

export interface QuizAttemptCreate {
  topic: string;
  subject?: string;
  correct: boolean;
  response_time_ms: number;
  difficulty?: string;
}

export interface NoteData {
  id: number;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodCreate {
  mood: string;
  energy: number;
  focus: number;
  stress: number;
  notes?: string;
}

export interface MoodEntry extends MoodCreate {
  id: number;
  created_at: string;
}

export interface PlannerTask {
  id: number;
  title: string;
  subject: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
  estimated_minutes: number;
  created_at: string;
}
