import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { prisma } from '../../src/lib/prisma';

const app = createTestApp();

describe('Tasks Module', () => {
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
      .send({ name: 'Task User', email: `tasks-${Date.now()}@example.com`, password: 'password123' });

    authToken = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Task Project' });

    projectId = projectRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let taskId: string;

  describe('POST /api/v1/tasks/project/:projectId', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Task', priority: 'HIGH' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.status).toBe('TODO');
      taskId = res.body.data.id;
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 'HIGH' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/tasks/project/:projectId', () => {
    it('should list tasks for a project', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/project/${projectId}?status=TODO`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((task: { status: string }) => {
        expect(task.status).toBe('TODO');
      });
    });

    it('should sort tasks', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/project/${projectId}?sortBy=priority&sortOrder=asc`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should get task by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(taskId);
    });
  });

  describe('PATCH /api/v1/tasks/:id/status', () => {
    it('should update task status', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should mark task as done and set completedAt', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it('should clear completedAt when moving back from DONE', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'TODO' });

      expect(res.status).toBe(200);
      expect(res.body.data.completedAt).toBeNull();
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Task', description: 'New description' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Task');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      const createRes = await request(app)
        .post(`/api/v1/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'To Delete' });

      const res = await request(app)
        .delete(`/api/v1/tasks/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
