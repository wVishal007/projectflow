import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { prisma } from '../../src/lib/prisma';

const app = createTestApp();

describe('Analytics Module', () => {
  let authToken: string;
  let projectId: string;

  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Analytics User', email: `analytics-${Date.now()}@example.com`, password: 'password123' });

    authToken = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Analytics Project' });

    projectId = projectRes.body.data.id;

    await request(app)
      .post(`/api/v1/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Analytics Task 1', priority: 'HIGH' });

    await request(app)
      .post(`/api/v1/tasks/project/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Analytics Task 2', priority: 'LOW' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/v1/analytics/overview', () => {
    it('should return dashboard overview', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalProjects');
      expect(res.body.data).toHaveProperty('totalTasks');
      expect(res.body.data).toHaveProperty('tasksByStatus');
      expect(res.body.data).toHaveProperty('completionRate');
      expect(res.body.data).toHaveProperty('overdueTasks');
      expect(res.body.data).toHaveProperty('recentTasks');
    });
  });

  describe('GET /api/v1/analytics/projects/:id', () => {
    it('should return project analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalTasks');
      expect(res.body.data).toHaveProperty('tasksByStatus');
      expect(res.body.data).toHaveProperty('tasksByPriority');
      expect(res.body.data.totalTasks).toBe(2);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/analytics/activity', () => {
    it('should return activity feed', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/activity?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(5);
    });
  });
});
