import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectflow_test?schema=public';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-16-chars';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-16-chars';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function cleanDatabase() {
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma, cleanDatabase };
