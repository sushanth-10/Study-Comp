import { useQuery } from '@tanstack/react-query';
import { studyApi } from '../api';
import { useDashboardStore } from '../stores/dashboard-store';

export function useDashboardData() {
  const { setOverview, setActivity, setInsights } = useDashboardStore();

  const overview = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: studyApi.getOverview,
    staleTime: 60_000,
  });

  const activity = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: studyApi.getActivity,
    staleTime: 60_000,
  });

  const insights = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: studyApi.getInsights,
    staleTime: 120_000,
  });

  if (overview.data) setOverview(overview.data);
  if (activity.data) setActivity(activity.data.items);
  if (insights.data) setInsights(insights.data.items);

  return { overview, activity, insights };
}
