import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const rawDbUrl = process.env.DATABASE_URL;

function createPrismaClient() {
  if (!rawDbUrl) {
    return null;
  }
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (err) {
    console.error('Failed to initialize PrismaClient:', err);
    return null;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (prisma) {
  globalForPrisma.prisma = prisma;
}



