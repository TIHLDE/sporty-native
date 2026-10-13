import type { Me } from '@/data/types';
import { getUserId, handler } from '@/server/http';
import { prisma } from '@/server/prisma';

export const GET = handler(async (request): Promise<Me> => {
  const userId = await getUserId(request);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      memberships: {
        where: { inactiveSince: { not: null } },
        include: { group: { select: { name: true } } },
        orderBy: { inactiveSince: 'desc' },
      },
    },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    inactiveIn: user.memberships.map((m) => ({
      groupId: m.groupId,
      groupName: m.group.name,
      since: m.inactiveSince!.toISOString(),
      reason: m.inactiveReason ?? '',
    })),
  };
});
