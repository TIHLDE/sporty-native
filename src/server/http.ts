// Felles hjelpere for API-rutene. Kun serverkode.

import type { Role } from '@/data/types';

import { HttpError } from './http-error';
import { type PhotonUser, getPhotonUser, verifyPhotonToken } from './photon';
import { prisma } from './prisma';

export { HttpError };

/**
 * Hvem som gjør forespørselen. Appen sender access tokenet fra «Logg inn med TIHLDE» som
 * `Authorization: Bearer …`, og alle API-ruter (unntatt opplastede filer og helsesjekk) krever det.
 *
 * Kun i utvikling: med ALLOW_DEV_USER_SWITCH=true kan en innlogget bruker opptre som en annen
 * bruker med `x-act-as` (Profil → Utvikling → Bytt bruker), for å teste ulike roller.
 */
export async function getUserId(request: Request) {
  const token = getAccessToken(request);
  const userId = await resolveUserId(token);

  const actAs = request.headers.get('x-act-as');
  if (actAs && actAs !== userId && process.env.ALLOW_DEV_USER_SWITCH === 'true') {
    const exists = await prisma.user.count({ where: { id: actAs } });
    if (!exists) throw new HttpError(401, 'Ukjent bruker');
    return actAs;
  }
  return userId;
}

/** Access tokenet fra «Logg inn med TIHLDE» i `Authorization`-headeren. */
export function getAccessToken(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new HttpError(401, 'Du må være logget inn');
  return token;
}

/**
 * Brukeren tokenet tilhører. Vanligvis sjekkes tokenet lokalt, uten kall til tihlde.org. Bare
 * første gang noen logger inn (eller når tokenet ikke kan sjekkes lokalt) spørres tihlde.org om
 * navn og e-post. Navn holdes ellers oppdatert av synken med tihlde.org.
 */
async function resolveUserId(token: string) {
  const sub = await verifyPhotonToken(token);
  if (sub) {
    const user = await prisma.user.findUnique({
      where: { photonId: sub },
      select: { id: true, email: true },
    });
    // Uten e-post er brukeren bare hentet fra en medlemsliste og har ikke logget inn før.
    if (user?.email) return user.id;
  }
  return findOrCreateUser(await getPhotonUser(token));
}

/**
 * Brukeren i Sporty for en TIHLDE-konto. Første gang kobles kontoen til en eksisterende bruker
 * med samme e-post, eller det lages en ny. Navn og e-post holdes oppdatert fra TIHLDE.
 */
async function findOrCreateUser(photonUser: PhotonUser) {
  const data = { name: photonUser.name, email: photonUser.email, photonId: photonUser.sub };
  // Finnes også når brukeren er hentet fra en medlemsliste før hen logget inn selv.
  const linked = await prisma.user.findUnique({ where: { photonId: photonUser.sub } });
  if (linked) {
    if (linked.name !== data.name || linked.email !== data.email) {
      // E-posten kan allerede tilhøre en annen bruker (f.eks. i seed-dataene). Da beholdes den
      // gamle, i stedet for at innloggingen feiler.
      const emailTaken = await prisma.user.count({
        where: { email: data.email, id: { not: linked.id } },
      });
      await prisma.user.update({
        where: { id: linked.id },
        data: emailTaken ? { name: data.name } : data,
      });
    }
    return linked.id;
  }
  const user = await prisma.user.upsert({
    where: { email: photonUser.email },
    create: data,
    update: { photonId: photonUser.sub, name: photonUser.name },
  });
  return user.id;
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
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { parentId: true },
  });
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

/** Om brukeren er sub-/admin i gruppen, eller i hovedgruppen hvis det er en undergruppe. */
export async function canManageGroup(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { parentId: true },
  });
  if (!group) return false;
  if (isManager(await getRole(userId, groupId))) return true;
  return Boolean(group.parentId && isManager(await getRole(userId, group.parentId)));
}

/** Sub-/admin i gruppen, eller i hovedgruppen hvis det er en undergruppe. */
export async function requireManagerOrParent(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { parentId: true },
  });
  if (!group) throw new HttpError(404, 'Fant ikke gruppen');
  if (isManager(await getRole(userId, groupId))) return;
  if (group.parentId && isManager(await getRole(userId, group.parentId))) return;
  throw new HttpError(403, 'Krever sub-/admin i gruppen');
}

/** Admin i gruppen, eller i hovedgruppen hvis det er en undergruppe. Subadmin er ikke nok. */
export async function requireAdminOrParent(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { parentId: true },
  });
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
