import type { GiveFinesInput } from '@/data/types';
import { fineContent } from '@/lib/notification-content';
import { notify } from '@/server/dto';
import { HttpError, getUserId, handler, readJson, requireManager } from '@/server/http';
import { prisma } from '@/server/prisma';
import { sendPush } from '@/server/push';

const MAX_COUNT = 20;

/** (Sub-/admin) Gi bot til én eller flere brukere for brudd på en paragraf. */
export const POST = handler(async (request) => {
  const userId = await getUserId(request);
  const input = await readJson<GiveFinesInput>(request);
  await requireManager(userId, input.groupId);

  if (!input.reason?.trim()) throw new HttpError(400, 'Begrunnelse må fylles ut');
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > MAX_COUNT) {
    throw new HttpError(400, `Antall bøter må være mellom 1 og ${MAX_COUNT}`);
  }
  if (!input.userIds?.length) throw new HttpError(400, 'Velg minst én bruker');

  const group = await prisma.group.findUniqueOrThrow({ where: { id: input.groupId } });
  if (group.parentId) throw new HttpError(400, 'Bøter gis i hovedgruppen, ikke i undergrupper');
  const law = await prisma.law.findUnique({ where: { id: input.lawId } });
  if (!law || law.groupId !== (group.parentId ?? group.id)) {
    throw new HttpError(400, 'Paragrafen hører ikke til gruppen');
  }
  const memberCount = await prisma.membership.count({
    where: { groupId: input.groupId, userId: { in: input.userIds } },
  });
  if (memberCount !== input.userIds.length) throw new HttpError(400, 'Alle må være medlem av gruppen');

  await prisma.fine.createMany({
    data: input.userIds.map((receiverId) => ({
      groupId: input.groupId,
      lawId: law.id,
      userId: receiverId,
      givenById: userId,
      reason: input.reason.trim(),
      count: input.count,
      imageUri: input.imageUri,
    })),
  });
  const amount = `${input.count} ${input.count === 1 ? 'bot' : 'bøter'}`;
  await notify(input.userIds, {
    groupId: input.groupId,
    type: 'fine',
    text: `Du har fått ${amount} i ${group.name} (§${law.paragraph} ${law.title})`,
    href: `/grupper/${input.groupId}`,
  });
  await sendPush(
    input.userIds,
    'fine',
    fineContent({
      count: input.count,
      groupId: input.groupId,
      groupName: group.name,
      paragraph: law.paragraph,
      lawTitle: law.title,
      reason: input.reason.trim(),
    })
  );

  return Response.json({ count: input.userIds.length }, { status: 201 });
});
