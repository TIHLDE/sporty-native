import { toGroup } from '@/server/dto';
import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Hovedgruppene brukeren er med i. */
export const GET = handler(async (request) => {
  const userId = await getUserId(request);
  const memberships = await prisma.membership.findMany({
    where: { userId, group: { parentId: null } },
    include: { group: true },
    orderBy: { group: { name: 'asc' } },
  });
  return memberships.map((m) => toGroup(m.group, m.role));
});
