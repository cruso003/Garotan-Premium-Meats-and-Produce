import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { getPrismaClient, disconnectDatabase } from './config/database';

const PORT = config.server.port;

// Initialize database connection
getPrismaClient();

// Start server
const server = app.listen(PORT, () => {
  logger.info(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🥩 Garotan Premium Meats & Produce - Management System  ║
  ║                                                           ║
  ║   Server running on: http://localhost:${PORT}             ║
  ║   Environment: ${config.node.env.toUpperCase().padEnd(42)} ║
  ║   API Prefix: ${config.server.apiPrefix.padEnd(48)} ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connection
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

export default server;
