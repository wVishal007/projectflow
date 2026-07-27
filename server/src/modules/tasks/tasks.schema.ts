import { z } from 'zod';
import { CONSTANTS } from '../../config/constants';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(CONSTANTS.TASK_PRIORITIES).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(CONSTANTS.TASK_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(CONSTANTS.TASK_STATUSES),
});

export const taskFilterSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'priority', 'due_date', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(CONSTANTS.TASK_STATUSES).optional(),
  priority: z.enum(CONSTANTS.TASK_PRIORITIES).optional(),
  assigneeId: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
