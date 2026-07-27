export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
  taskStats?: TaskStats;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  cancelled: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  project?: Project;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  taskId: string;
  userId: string;
  user: User;
  task: Task & { project: { id: string; name: string } };
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string; details?: Array<{ field?: string; message: string }> };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OverviewAnalytics {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: TaskStats;
  completionRate: number;
  overdueTasks: number;
  recentTasks: Task[];
}
