import { handler } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Alle brukere. Brukes av dev-innloggingen på Profil for å bytte bruker. */
export const GET = handler(async () => prisma.user.findMany({ orderBy: { name: 'asc' } }));
