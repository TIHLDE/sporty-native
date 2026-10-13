import type { GroupDetails, UpdateGroupInput } from '@/data/types';
import { toGroup } from '@/server/dto';
import {
  HttpError,
  getUserId,
  handler,
  readJson,
  requireAccess,
  requireAdminOrParent,
} from '@/server/http';
import { prisma } from '@/server/prisma';

const ROLE_ORDER = { admin: 0, subadmin: 1, member: 2 };

export const GET = handler<{ groupId: string }>(
  async (request, { groupId }): Promise<GroupDetails> => {
    const userId = await getUserId(request);
    const { role } = await requireAccess(userId, groupId);

    const group = await prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: {
        subgroups: {
          include: { memberships: { select: { userId: true, role: true } } },
          orderBy: { name: 'asc' },
        },
        memberships: { include: { user: true } },
      },
    });

    return {
      ...toGroup(group, role),
      subgroups: group.subgroups.map((s) =>
        toGroup(s, s.memberships.find((m) => m.userId === userId)?.role ?? null)
      ),
      members: group.memberships
        .map((m) => ({
          user: m.user,
          role: m.role,
          position: group.usesPositions ? m.position : null,
          subgroupNames: group.subgroups
            .filter((s) => s.memberships.some((sm) => sm.userId === m.userId))
            .map((s) => s.name),
        }))
        .sort(
          (a, b) =>
            ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.user.name.localeCompare(b.user.name)
        ),
    };
  }
);

/** (Admin) Endre gruppenavn, beskrivelse og forsidebilde. Felt som ikke sendes, endres ikke. */
export const PATCH = handler<{ groupId: string }>(async (request, { groupId }) => {
  const userId = await getUserId(request);
  await requireAdminOrParent(userId, groupId);
  const input = await readJson<UpdateGroupInput>(request);

  const data: { name?: string; description?: string; coverUploadId?: string | null } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new HttpError(400, 'Gruppen må ha et navn');
    if (name.length > 60) throw new HttpError(400, 'Gruppenavnet kan ha maks 60 tegn');
    data.name = name;
  }
  if (input.description !== undefined) {
    if (input.description.length > 1000)
      throw new HttpError(400, 'Beskrivelsen kan ha maks 1000 tegn');
    data.description = input.description.trim();
  }
  if (input.coverUploadId !== undefined) {
    if (input.coverUploadId !== null) {
      const upload = await prisma.upload.findUnique({ where: { id: input.coverUploadId } });
      if (!upload || upload.uploadedById !== userId || upload.kind !== 'image') {
        throw new HttpError(400, 'Ugyldig bilde');
      }
    }
    data.coverUploadId = input.coverUploadId;
  }

  const { role } = await requireAccess(userId, groupId);
  const group = await prisma.group.update({ where: { id: groupId }, data });
  return toGroup(group, role);
});
