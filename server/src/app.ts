import express from 'express';
import path from 'path';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/logger';
import { securityMiddleware } from './middleware/security';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { tasksRoutes } from './modules/tasks/tasks.routes';
import { commentsRoutes } from './modules/comments/comments.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { auditsRoutes } from './modules/audits/audits.routes';
import { prisma } from './lib/prisma';
import { env } from './config/env';
import { createChildLogger } from './utils/logger';

const logger = createChildLogger('app');

export function createApp() {
  const app = express();

  app.set('trust proxy', 'loopback');

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(requestId);
  app.use(requestLogger);
  app.use(securityMiddleware);
  app.use(rateLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/health/live', (_req, res) => {
    res.json({ status: 'alive' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', database: 'connected' });
    } catch (err) {
      res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/projects', projectsRoutes);
  app.use('/api/v1/tasks', tasksRoutes);
  app.use('/api/v1/comments', commentsRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/audits', auditsRoutes);

  const clientDistPath = path.resolve(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  app.use(errorHandler);

  return app;
}
