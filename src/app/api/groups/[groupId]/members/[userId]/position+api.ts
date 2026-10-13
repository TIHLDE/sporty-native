import type { Position } from '@/data/types';
import { HttpError, getUserId, handler, readJson, requireManagerOrParent } from '@/server/http';
import { prisma } from '@/server/prisma';

const POSITIONS: Position[] = ['keeper', 'back', 'midtstopper', 'midtbane', 'ving', 'spiss'];

/** (Sub-/admin) Sett stillingen til et medlem. `null` fjerner stillingen. */
export const PUT = handler<{ groupId: string; userId: string }>(
  async (request, { groupId, userId: memberId }) => {
    const userId = await getUserId(request);
    await requireManagerOrParent(userId, groupId);
    const { position } = await readJson<{ position: Position | null }>(request);
    if (position !== null && !POSITIONS.includes(position)) throw new HttpError(400, 'Ugyldig stilling');

    const group = await prisma.group.findUniqueOrThrow({ where: { id: groupId } });
    if (!group.usesPositions) throw new HttpError(400, 'Gruppen bruker ikke stillinger');

    const updated = await prisma.membership.updateMany({
      where: { groupId, userId: memberId },
      data: { position },
    });
    if (updated.count === 0) throw new HttpError(404, 'Brukeren er ikke medlem av gruppen');
    return { position };
  }
);
