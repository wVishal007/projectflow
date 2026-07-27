import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { prisma } from '../../src/lib/prisma';

const app = createTestApp();

describe('Comments Module', () => {
  let authToken: string;
  let taskId: string;

  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Comment User', email: `comments-${Date.now()}@example.com`, password: 'password123' });

    authToken = res.body.data.accessToken;

    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Comment Project' });

    const taskRes = await request(app)
      .post(`/api/v1/tasks/project/${projectRes.body.data.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Comment Task' });

    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let commentId: string;

  describe('POST /api/v1/comments/task/:taskId', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/task/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'This is a test comment' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('This is a test comment');
      expect(res.body.data.author).toHaveProperty('name');
      commentId = res.body.data.id;
    });

    it('should reject empty comment', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/task/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/comments/task/:taskId', () => {
    it('should list comments for a task', async () => {
      const res = await request(app)
        .get(`/api/v1/comments/task/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should delete own comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for already deleted comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
