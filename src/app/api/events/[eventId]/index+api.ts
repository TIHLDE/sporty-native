import type { CreateEventInput } from '@/data/types';
import { eventInclude, notify, toEvent } from '@/server/dto';
import { parseEventInput, rememberPlace } from '@/server/events';
import {
  HttpError,
  getUserId,
  handler,
  readJson,
  requireAccess,
  requireManagerOrParent,
} from '@/server/http';
import { prisma } from '@/server/prisma';

export const GET = handler<{ eventId: string }>(async (request, { eventId }) => {
  const userId = await getUserId(request);
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: eventInclude });
  if (!event) throw new HttpError(404, 'Fant ikke arrangementet');
  await requireAccess(userId, event.groupId);
  return toEvent(event, userId);
});

/**
 * (Sub-/admin) Rediger et arrangement som ikke er ferdig. Svarene beholdes, og medlemmene får
 * et varsel om at noe er endret.
 */
export const PUT = handler<{ eventId: string }>(async (request, { eventId }) => {
  const userId = await getUserId(request);
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true },
  });
  if (!existing) throw new HttpError(404, 'Fant ikke arrangementet');
  await requireManagerOrParent(userId, existing.groupId);
  if ((existing.endsAt ?? existing.startsAt) < new Date()) {
    throw new HttpError(400, 'Arrangementet er ferdig og kan ikke endres');
  }

  const data = parseEventInput(await readJson<CreateEventInput>(request));
  const event = await prisma.event.update({ where: { id: eventId }, data, include: eventInclude });
  await rememberPlace(existing.group, data);

  await notify(
    event.group.memberships.map((m) => m.userId).filter((id) => id !== userId),
    {
      groupId: event.groupId,
      type: 'event',
      text: `Arrangementet «${data.title}» i ${existing.group.name} er endret`,
      href: `/grupper/${event.groupId}/arrangement/${event.id}`,
    }
  );

  return toEvent(event, userId);
});

/**
 * (Sub-/admin) Slett et arrangement. Svarene slettes med det, mens bøter som er gitt for det
 * beholdes (uten kobling). Kommende arrangementer varsles som avlyst.
 */
export const DELETE = handler<{ eventId: string }>(async (request, { eventId }) => {
  const userId = await getUserId(request);
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: { include: { memberships: { select: { userId: true } } } } },
  });
  if (!event) throw new HttpError(404, 'Fant ikke arrangementet');
  await requireManagerOrParent(userId, event.groupId);

  const upcoming = (event.endsAt ?? event.startsAt) >= new Date();
  await prisma.$transaction([
    // Gamle varsler lenker til arrangementet og ville ført til en side som ikke finnes.
    prisma.notification.deleteMany({ where: { href: { endsWith: `/arrangement/${eventId}` } } }),
    prisma.event.delete({ where: { id: eventId } }),
  ]);

  if (upcoming) {
    await notify(
      event.group.memberships.map((m) => m.userId).filter((id) => id !== userId),
      {
        groupId: event.groupId,
        type: 'event',
        text: `Arrangementet «${event.title}» i ${event.group.name} er avlyst`,
        href: `/grupper/${event.groupId}`,
      }
    );
  }

  return { ok: true };
});
