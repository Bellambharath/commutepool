import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient.
 * In development, reuse the global instance to avoid exhausting DB connections
 * during hot-reloads (tsx watch).
 */
export const prisma: PrismaClient =
  globalThis.__prismaClient ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__prismaClient = prisma;
}
