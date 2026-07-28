import apiClient from './client';

export const auditsApi = {
  create: (data: { url: string }) =>
    apiClient.post('/audits', data).then((r) => r.data),

  list: (params?: Record<string, string>) =>
    apiClient.get('/audits', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/audits/${id}`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/audits/${id}`).then((r) => r.data),
};
