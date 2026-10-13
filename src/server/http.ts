// Felles hjelpere for API-rutene. Kun serverkode.

import type { Role } from '@/data/types';

import { prisma } from './prisma';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Hvem som gjør forespørselen. Foreløpig sender appen bruker-ID-en i en header (dev-innlogging),
 * dette byttes ut med ekte innlogging via TIHLDE senere.
 */
export async function getUserId(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new HttpError(401, 'Mangler x-user-id');
  const exists = await prisma.user.count({ where: { id: userId } });
  if (!exists) throw new HttpError(401, 'Ukjent bruker');
  return userId;
}

export async function getRole(userId: string, groupId: string): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return membership?.role ?? null;
}

export const isManager = (role: Role | null) => role === 'admin' || role === 'subadmin';

export async function requireMember(userId: string, groupId: string) {
  const role = await getRole(userId, groupId);
  if (!role) throw new HttpError(403, 'Du er ikke medlem av gruppen');
  return role;
}

/** Lesetilgang: medlem av gruppen, eller av hovedgruppen hvis det er en undergruppe. */
export async function requireAccess(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { parentId: true } });
  if (!group) throw new HttpError(404, 'Fant ikke gruppen');
  const role = await getRole(userId, groupId);
  if (!role && !(group.parentId && (await getRole(userId, group.parentId)))) {
    throw new HttpError(403, 'Du har ikke tilgang til gruppen');
  }
  return { role, parentId: group.parentId };
}

export async function requireManager(userId: string, groupId: string) {
  const role = await getRole(userId, groupId);
  if (!isManager(role)) throw new HttpError(403, 'Krever sub-/admin i gruppen');
  return role;
}

/** Sub-/admin i gruppen, eller i hovedgruppen hvis det er en undergruppe. */
export async function requireManagerOrParent(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { parentId: true } });
  if (!group) throw new HttpError(404, 'Fant ikke gruppen');
  if (isManager(await getRole(userId, groupId))) return;
  if (group.parentId && isManager(await getRole(userId, group.parentId))) return;
  throw new HttpError(403, 'Krever sub-/admin i gruppen');
}

/** Admin i gruppen, eller i hovedgruppen hvis det er en undergruppe. Subadmin er ikke nok. */
export async function requireAdminOrParent(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { parentId: true } });
  if (!group) throw new HttpError(404, 'Fant ikke gruppen');
  if ((await getRole(userId, groupId)) === 'admin') return;
  if (group.parentId && (await getRole(userId, group.parentId)) === 'admin') return;
  throw new HttpError(403, 'Krever admin i gruppen');
}

/** Pakker inn en API-handler slik at HttpError blir riktig statuskode og alt annet 500. */
export function handler<P extends Record<string, string>>(
  fn: (request: Request, params: P) => Promise<unknown>
) {
  return async (request: Request, params: P) => {
    try {
      const result = await fn(request, params);
      return result instanceof Response ? result : Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      console.error(error);
      return Response.json({ error: 'Noe gikk galt på serveren' }, { status: 500 });
    }
  };
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'Ugyldig JSON');
  }
}
