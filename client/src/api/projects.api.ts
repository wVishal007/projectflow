import apiClient from './client';

export const projectsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get('/projects', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; color?: string }) =>
    apiClient.post('/projects', data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    apiClient.put(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/projects/${id}`).then((r) => r.data),
};
