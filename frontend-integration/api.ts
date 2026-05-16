import type { ActivityItem, DashboardOverview, InsightItem } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'API request failed');
  }
  return data as T;
}

export const studyApi = {
  getOverview: () => request<DashboardOverview>('/api/dashboard/overview'),
  getActivity: () => request<{ items: ActivityItem[] }>('/api/dashboard/activity'),
  getInsights: () => request<{ items: InsightItem[] }>('/api/dashboard/insights'),
  generateQuiz: (payload: unknown) =>
    request('/api/quiz/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateFlashcards: (payload: unknown) =>
    request('/api/flashcards/generate', { method: 'POST', body: JSON.stringify(payload) }),
  generateStudyPlan: (payload: unknown) =>
    request('/api/planner/generate', { method: 'POST', body: JSON.stringify(payload) }),
  updateAnalytics: (payload: unknown) =>
    request('/api/analytics/update', { method: 'POST', body: JSON.stringify(payload) }),
};
