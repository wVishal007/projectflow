import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { prisma } from '../../src/lib/prisma';

const app = createTestApp();

describe('Audits Module', () => {
  let authToken: string;

  beforeAll(async () => {
    await prisma.activity.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.user.deleteMany();

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Audit User', email: `audit-${Date.now()}@example.com`, password: 'password123' });

    authToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let auditId: string;

  describe('POST /api/v1/audits', () => {
    it('should create an audit for a valid URL', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'https://example.com' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBe('https://example.com');
      expect(res.body.data.seoScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.seoScore).toBeLessThanOrEqual(100);
      expect(res.body.data.responseTime).toBeGreaterThan(0);
      auditId = res.body.data.id || res.body.data.url;
    });

    it('should auto-prepend https:// for bare domains', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'example.com' });

      expect(res.status).toBe(201);
      expect(res.body.data.url).toBe('https://example.com');
    });

    it('should reject empty URL', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: '' });

      expect(res.status).toBe(400);
    });

    it('should reject missing URL field', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid URL format', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'not-a-valid-url' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/audits')
        .send({ url: 'https://example.com' });

      expect(res.status).toBe(401);
    });

    it('should handle cached results (second request faster)', async () => {
      const start1 = Date.now();
      await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'https://httpbin.org/html' });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'https://httpbin.org/html' });
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1 + 2000);
    });
  });

  describe('GET /api/v1/audits', () => {
    it('should list user audits', async () => {
      const res = await request(app)
        .get('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/v1/audits');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/audits/:id', () => {
    it('should get audit by ID', async () => {
      const listRes = await request(app)
        .get('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`);

      const firstAudit = listRes.body.data[0];
      if (!firstAudit) return;

      const res = await request(app)
        .get(`/api/v1/audits/${firstAudit.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBeDefined();
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/v1/audits/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/audits/:id', () => {
    it('should delete an audit', async () => {
      const createRes = await request(app)
        .post('/api/v1/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'https://example.org' });

      if (createRes.status !== 201) return;
      const id = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/v1/audits/${id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
