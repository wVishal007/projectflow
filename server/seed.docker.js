const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function seed() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@projectflow.com' },
    update: {},
    create: { name: 'Demo User', email: 'demo@projectflow.com', passwordHash: hash },
  });
  console.log('User:', user.id);

  const p1 = await prisma.project.create({
    data: { name: 'Website Redesign', description: 'Complete overhaul', color: '#3B82F6', ownerId: user.id },
  });
  const p2 = await prisma.project.create({
    data: { name: 'Mobile App', description: 'Build the MVP', color: '#10B981', ownerId: user.id },
  });
  console.log('Projects created');

  const tasks = [
    { title: 'Design homepage mockup', status: 'DONE', priority: 'HIGH', projectId: p1.id, assigneeId: user.id },
    { title: 'Implement responsive header', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: p1.id, assigneeId: user.id },
    { title: 'Set up CI/CD pipeline', status: 'TODO', priority: 'HIGH', projectId: p1.id },
    { title: 'Create auth flow', status: 'TODO', priority: 'URGENT', projectId: p2.id, assigneeId: user.id },
    { title: 'Design onboarding', status: 'IN_PROGRESS', priority: 'HIGH', projectId: p2.id },
  ];

  for (const t of tasks) {
    const c = await prisma.task.create({
      data: { ...t, completedAt: t.status === 'DONE' ? new Date() : undefined },
    });
    await prisma.activity.create({
      data: { taskId: c.id, userId: user.id, action: 'created', details: { title: c.title } },
    });
  }
  console.log('Seeded', tasks.length, 'tasks');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
