import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { prisma } from '../../src/lib/prisma';

const app = createTestApp();

describe('Projects Module', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Project User', email: `projects-${Date.now()}@example.com`, password: 'password123' });

    authToken = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let projectId: string;

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Project', description: 'A test project', color: '#FF5733' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Project');
      expect(res.body.data.ownerId).toBe(userId);
      projectId = res.body.data.id;
    });

    it('should reject project without name', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Unauth Project' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
    });

    it('should support search', async () => {
      const res = await request(app)
        .get('/api/v1/projects?search=Test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data).toHaveProperty('taskStats');
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    it('should update a project', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Project' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Project');
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });

      const res = await request(app)
        .delete(`/api/v1/projects/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createRes.body.data.id);
    });
  });
});
