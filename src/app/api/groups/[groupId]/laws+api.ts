import { getUserId, handler, requireAccess } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Botreglene til gruppen. Undergrupper bruker reglene til hovedgruppen. */
export const GET = handler<{ groupId: string }>(async (request, { groupId }) => {
  const userId = await getUserId(request);
  const { parentId } = await requireAccess(userId, groupId);
  return prisma.law.findMany({
    where: { groupId: parentId ?? groupId },
    orderBy: { paragraph: 'asc' },
  });
});
