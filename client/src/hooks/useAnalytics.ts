import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.overview,
  });
}

export function useProjectAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['analytics', 'project', projectId],
    queryFn: () => analyticsApi.project(projectId),
    enabled: !!projectId,
  });
}

export function useActivityFeed(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['analytics', 'activity', params],
    queryFn: () => analyticsApi.activity(params),
  });
}
