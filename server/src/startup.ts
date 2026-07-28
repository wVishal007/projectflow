import { execSync } from 'child_process';
import bcrypt from 'bcrypt';
import { prisma } from './lib/prisma';
import { createChildLogger } from './utils/logger';

const logger = createChildLogger('startup');

export async function runMigrations(): Promise<void> {
  try {
    logger.info('Running prisma db push...');
    execSync('npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss', {
      stdio: 'pipe',
      cwd: __dirname + '/..',
      timeout: 60000,
    });
    logger.info('Schema pushed successfully');
  } catch (err: any) {
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    logger.error({ err: err.message, stderr, stdout }, 'Migration failed');
    throw err;
  }
}

export async function runSeed(): Promise<void> {
  try {
    logger.info('Running database seed...');

    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@projectflow.com' },
    });

    if (existingUser) {
      logger.info('Seed data already exists, skipping');
      return;
    }

    const passwordHash = await bcrypt.hash('password123', 12);

    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@projectflow.com',
        passwordHash,
      },
    });

    const project1 = await prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design',
        color: '#3B82F6',
        ownerId: user.id,
      },
    });

    const project2 = await prisma.project.create({
      data: {
        name: 'Mobile App',
        description: 'Build the MVP for our mobile application',
        color: '#10B981',
        ownerId: user.id,
      },
    });

    const tasks = [
      { title: 'Design homepage mockup', status: 'DONE' as const, priority: 'HIGH' as const, projectId: project1.id },
      { title: 'Implement responsive header', status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, projectId: project1.id },
      { title: 'Set up CI/CD pipeline', status: 'TODO' as const, priority: 'HIGH' as const, projectId: project1.id },
      { title: 'Write API documentation', status: 'IN_REVIEW' as const, priority: 'LOW' as const, projectId: project1.id },
      { title: 'Create user authentication flow', status: 'TODO' as const, priority: 'URGENT' as const, projectId: project2.id },
      { title: 'Design onboarding screens', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, projectId: project2.id },
      { title: 'Set up push notifications', status: 'TODO' as const, priority: 'MEDIUM' as const, projectId: project2.id },
    ];

    for (const task of tasks) {
      const created = await prisma.task.create({
        data: {
          ...task,
          assigneeId: user.id,
          completedAt: task.status === 'DONE' ? new Date() : undefined,
        },
      });

      await prisma.activity.create({
        data: {
          taskId: created.id,
          userId: user.id,
          action: 'created',
          details: { title: created.title },
        },
      });
    }

    logger.info('Seed completed: 1 user, 2 projects, 7 tasks');
  } catch (err) {
    logger.error({ err }, 'Seed failed');
  }
}
