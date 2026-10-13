import { fineInclude, toFine } from '@/server/dto';
import { getUserId, handler, isManager, requireAccess } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Sub-/admin ser alle bøter i gruppen, medlemmer bare sine egne. */
export const GET = handler<{ groupId: string }>(async (request, { groupId }) => {
  const userId = await getUserId(request);
  const { role } = await requireAccess(userId, groupId);
  const fines = await prisma.fine.findMany({
    where: { groupId, ...(isManager(role) ? {} : { userId }) },
    include: fineInclude,
    orderBy: { createdAt: 'desc' },
  });
  return fines.map(toFine);
});
