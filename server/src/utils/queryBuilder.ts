import { Request } from 'express';

export interface QueryOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

const FIELD_MAP: Record<string, string> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  due_date: 'dueDate',
};

function mapField(field: string): string {
  return FIELD_MAP[field] || field;
}

export function parseQueryOptions(req: Request): QueryOptions {
  return {
    search: (req.query.search as string) || undefined,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    filters: extractFilters(req),
  };
}

function extractFilters(req: Request): Record<string, string> {
  const skipKeys = new Set(['page', 'limit', 'search', 'sortBy', 'sortOrder']);
  const filters: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.query)) {
    if (!skipKeys.has(key) && typeof value === 'string') {
      filters[key] = value;
    }
  }

  return filters;
}

export function buildSearchWhere(fields: string[], search?: string): Record<string, unknown> | undefined {
  if (!search || fields.length === 0) return undefined;

  if (fields.length === 1) {
    return { [fields[0]]: { contains: search, mode: 'insensitive' as const } };
  }

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}

export function buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, string> {
  const allowedSortFields = new Set([
    'created_at', 'updated_at', 'createdAt', 'updatedAt',
    'name', 'title', 'status', 'priority', 'due_date', 'dueDate',
  ]);

  const raw = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
  const field = mapField(raw);

  return { [field]: sortOrder };
}
