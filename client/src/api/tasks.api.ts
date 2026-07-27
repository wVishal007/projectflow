import apiClient from './client';

export const tasksApi = {
  listByProject: (projectId: string, params?: Record<string, string>) =>
    apiClient.get(`/tasks/project/${projectId}`, { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/tasks/${id}`).then((r) => r.data),

  create: (projectId: string, data: { title: string; description?: string; priority?: string; assigneeId?: string; dueDate?: string }) =>
    apiClient.post(`/tasks/project/${projectId}`, data).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/tasks/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/tasks/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/tasks/${id}`).then((r) => r.data),
};
