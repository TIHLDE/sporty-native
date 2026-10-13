import { prisma } from '@/server/prisma';

/** Rask sjekk av at API-et og databasen svarer. */
export async function GET() {
  const users = await prisma.user.count();
  return Response.json({ ok: true, users });
}
