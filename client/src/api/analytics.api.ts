import apiClient from './client';

export const analyticsApi = {
  overview: () =>
    apiClient.get('/analytics/overview').then((r) => r.data),

  project: (id: string) =>
    apiClient.get(`/analytics/projects/${id}`).then((r) => r.data),

  activity: (params?: Record<string, string>) =>
    apiClient.get('/analytics/activity', { params }).then((r) => r.data),
};
