import { create } from 'zustand';
import type { ActivityItem, DashboardOverview, InsightItem } from '../types';

type DashboardState = {
  overview: DashboardOverview | null;
  activity: ActivityItem[];
  insights: InsightItem[];
  setOverview: (overview: DashboardOverview) => void;
  setActivity: (activity: ActivityItem[]) => void;
  setInsights: (insights: InsightItem[]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  overview: null,
  activity: [],
  insights: [],
  setOverview: (overview) => set({ overview }),
  setActivity: (activity) => set({ activity }),
  setInsights: (insights) => set({ insights }),
}));
