import request from 'supertest';
import { createTestApp } from './testApp';
import { prisma } from '../../src/lib/prisma';
import { hashPassword } from '../../src/utils/password';

const app = createTestApp();

export async function createTestUser(userData?: { name?: string; email?: string; password?: string }) {
  const name = userData?.name || 'Test User';
  const email = userData?.email || `test-${Date.now()}@example.com`;
  const password = userData?.password || 'password123';
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  return { user, password };
}

export async function getAuthToken(userData?: { name?: string; email?: string; password?: string }) {
  const email = userData?.email || `auth-${Date.now()}@example.com`;
  const password = userData?.password || 'password123';

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: userData?.name || 'Auth User', email, password });

  return {
    token: res.body.data.accessToken,
    user: res.body.data.user,
    password,
  };
}

export async function createAuthenticatedRequest() {
  const { token } = await getAuthToken();
  return { token, app };
}
