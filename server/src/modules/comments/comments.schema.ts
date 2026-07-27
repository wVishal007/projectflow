import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
