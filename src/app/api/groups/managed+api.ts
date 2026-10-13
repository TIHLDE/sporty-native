import { toGroup } from '@/server/dto';
import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Hovedgrupper der brukeren er sub-/admin, altså der den kan gi bøter. Bøter gjelder alltid hele
 * gruppen, så undergrupper er ikke med. */
export const GET = handler(async (request) => {
  const userId = await getUserId(request);
  const memberships = await prisma.membership.findMany({
    where: { userId, role: { in: ['admin', 'subadmin'] }, group: { parentId: null } },
    include: { group: true },
    orderBy: { group: { name: 'asc' } },
  });
  return memberships.map((m) => toGroup(m.group, m.role));
});
