import { fineInclude, toFine } from '@/server/dto';
import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

export const GET = handler(async (request) => {
  const userId = await getUserId(request);
  const fines = await prisma.fine.findMany({
    where: { userId },
    include: fineInclude,
    orderBy: { createdAt: 'desc' },
  });
  return fines.map(toFine);
});
