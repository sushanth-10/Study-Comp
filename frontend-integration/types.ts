export type DashboardOverview = {
  studyHours: number;
  weeklyStreak: number;
  focusScore: number;
  learningVelocity: number;
  masteryLevel: number;
  topicCompletion: number;
  fatigueScore: number;
  weeklyConsistency: number;
};

export type ActivityItem = {
  title: string;
  subject: string;
  timestamp: string;
  durationMinutes: number;
  completion: number;
  trend: 'up' | 'down' | 'stable';
};

export type InsightItem = {
  title: string;
  message: string;
  metric: string;
  severity: 'info' | 'warning' | 'success';
};
