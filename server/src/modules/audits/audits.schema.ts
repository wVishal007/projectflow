import { z } from 'zod';

export const createAuditSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .max(2048, 'URL too long')
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    })
    .refine(
      (val) => {
        try {
          const parsed = new URL(val);
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL format. Must be a valid HTTP/HTTPS URL.' }
    ),
});

export const auditFilterSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.enum(['created_at', 'seo_score', 'url']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type AuditFilterInput = z.infer<typeof auditFilterSchema>;
