import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

/** Varsler til brukeren. ?groupId= begrenser til én gruppe. */
export const GET = handler(async (request) => {
  const userId = await getUserId(request);
  const groupId = new URL(request.url).searchParams.get('groupId');
  const notifications = await prisma.notification.findMany({
    where: { userId, ...(groupId ? { groupId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return notifications.map(({ userId: _userId, ...n }) => ({ ...n, createdAt: n.createdAt.toISOString() }));
});
