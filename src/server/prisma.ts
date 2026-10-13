// Kun for serverkode (API-ruter). Skal aldri importeres fra skjermer eller komponenter.
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

// Gjenbruk klienten på tvers av hot reloads i utvikling, ellers åpnes nye tilkoblinger hver gang.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
