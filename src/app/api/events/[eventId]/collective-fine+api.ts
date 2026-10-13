import { fineContent } from '@/lib/notification-content';
import { notify } from '@/server/dto';
import { HttpError, getUserId, handler, requireManager } from '@/server/http';
import { prisma } from '@/server/prisma';
import { sendPush } from '@/server/push';

/** Paragrafen som brukes for fellesbot (ikke svart innen fristen). */
const SVARFRIST_PARAGRAPH = '1.01';

/** (Sub-/admin) Gi én bot til alle medlemmer som ikke har svart på arrangementet. */
export const POST = handler<{ eventId: string }>(async (request, { eventId }) => {
  const userId = await getUserId(request);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: { include: { memberships: true } }, attendances: true },
  });
  if (!event) throw new HttpError(404, 'Fant ikke arrangementet');
  // Bøter gjelder hele gruppen, så fellesbot for et arrangement i en undergruppe havner i
  // hovedgruppen, og krever sub-/admin der.
  const fineGroupId = event.group.parentId ?? event.groupId;
  await requireManager(userId, fineGroupId);

  // Bare når man ikke lenger kan svare: etter fristen, eller etter start hvis det ikke er frist.
  const closesAt = event.signupDeadline ?? event.startsAt;
  if (closesAt > new Date()) {
    throw new HttpError(
      400,
      event.signupDeadline
        ? 'Fellesbot kan gis når påmeldingsfristen har gått ut'
        : 'Fellesbot kan gis når arrangementet har startet'
    );
  }

  const law = await prisma.law.findUnique({
    where: {
      groupId_paragraph: {
        groupId: event.group.parentId ?? event.groupId,
        paragraph: SVARFRIST_PARAGRAPH,
      },
    },
  });
  if (!law) throw new HttpError(400, `Gruppen mangler §${SVARFRIST_PARAGRAPH} i botreglene`);

  const answered = new Set(event.attendances.map((a) => a.userId));
  const receivers = event.group.memberships.map((m) => m.userId).filter((id) => !answered.has(id));
  if (receivers.length === 0) return { count: 0 };

  const fineGroup = await prisma.group.findUniqueOrThrow({ where: { id: fineGroupId } });
  const reason = `Svarte ikke på ${event.title}`;
  await prisma.fine.createMany({
    data: receivers.map((receiverId) => ({
      groupId: fineGroupId,
      lawId: law.id,
      userId: receiverId,
      givenById: userId,
      reason,
      collective: true,
      eventId,
    })),
  });
  await notify(receivers, {
    groupId: fineGroupId,
    type: 'fine',
    text: `Du har fått 1 bot i ${fineGroup.name}: svarte ikke på ${event.title}`,
    href: `/grupper/${fineGroupId}`,
  });
  await sendPush(
    receivers,
    'fine',
    fineContent({
      count: 1,
      groupId: fineGroupId,
      groupName: fineGroup.name,
      paragraph: law.paragraph,
      lawTitle: law.title,
      reason,
    })
  );

  return { count: receivers.length };
});
