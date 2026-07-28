import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { createChildLogger } from './utils/logger';
import { runMigrations, runSeed } from './startup';

const logger = createChildLogger('server');

async function main() {
  const app = createApp();

  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  }

  await runMigrations();
  await runSeed();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

main();

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});
