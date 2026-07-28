export const CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  TASK_STATUSES: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const,
  TASK_PRIORITIES: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const,
  ACTIVITY_ACTIONS: {
    CREATED: 'created',
    UPDATED: 'updated',
    STATUS_CHANGED: 'status_changed',
    COMPLETED: 'completed',
    DELETED: 'deleted',
  } as const,
  BCRYPT_ROUNDS: 12,
  AUDIT: {
    CACHE_TTL_MS: 60 * 60 * 1000,
    FETCH_TIMEOUT_MS: 10000,
    MAX_URL_LENGTH: 2048,
  },
} as const;
