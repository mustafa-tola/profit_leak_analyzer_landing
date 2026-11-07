import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  plaPrisma?: PrismaClient;
};

/**
 * Lazily creates one Prisma client per process. Keeping this lazy means tests
 * that only use the in-memory repository never require DATABASE_URL.
 */
export function getPrismaClient(): PrismaClient {
  globalForPrisma.plaPrisma ??= new PrismaClient();
  return globalForPrisma.plaPrisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalForPrisma.plaPrisma) return;
  await globalForPrisma.plaPrisma.$disconnect();
  globalForPrisma.plaPrisma = undefined;
}
