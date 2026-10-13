import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

export const GET = handler(async (request) => {
  const userId = await getUserId(request);
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
});
