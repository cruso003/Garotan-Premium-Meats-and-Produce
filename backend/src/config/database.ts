import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton instance
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    // Handle connection lifecycle
    prisma.$connect()
      .then(() => {
        logger.info('✓ Database connected successfully');
      })
      .catch((error) => {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
      });
  }

  return prisma;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('✓ Database disconnected');
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default getPrismaClient();
