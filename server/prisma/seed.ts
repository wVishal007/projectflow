import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@projectflow.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@projectflow.com',
      passwordHash,
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

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

  console.log(`Created projects: ${project1.name}, ${project2.name}`);

  const taskData: Array<Prisma.TaskUncheckedCreateInput> = [
    { title: 'Design homepage mockup', status: 'DONE', priority: 'HIGH', projectId: project1.id, assigneeId: user.id },
    { title: 'Implement responsive header', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: project1.id, assigneeId: user.id },
    { title: 'Set up CI/CD pipeline', status: 'TODO', priority: 'HIGH', projectId: project1.id },
    { title: 'Write API documentation', status: 'IN_REVIEW', priority: 'LOW', projectId: project1.id, assigneeId: user.id },
    { title: 'Create user authentication flow', status: 'TODO', priority: 'URGENT', projectId: project2.id, assigneeId: user.id },
    { title: 'Design onboarding screens', status: 'IN_PROGRESS', priority: 'HIGH', projectId: project2.id },
    { title: 'Set up push notifications', status: 'TODO', priority: 'MEDIUM', projectId: project2.id },
  ];

  for (const task of taskData) {
    const created = await prisma.task.create({
      data: {
        ...task,
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

  console.log(`Created ${taskData.length} tasks`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
