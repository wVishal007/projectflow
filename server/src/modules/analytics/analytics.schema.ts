import { z } from 'zod';

export const projectAnalyticsParamsSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  projectId: z.string().uuid().optional(),
});
