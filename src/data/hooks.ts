// Alle API-kall appen gjør, som React Query-hooks. Skjermene henter data kun herfra.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { api } from '@/lib/api';
import { getValidAccessToken } from '@/lib/auth/photon';

import type {
  Announcement,
  AnnouncementDetails,
  Answer,
  Conversation,
  ConversationDetails,
  CreateAnnouncementInput,
  CreateEventInput,
  CreatePaymentInput,
  CreatePollInput,
  CreateSubgroupInput,
  Event,
  Fine,
  FineStatus,
  FinesPage,
  GiveFinesInput,
  Group,
  GroupDetails,
  GroupFile,
  GroupPosition,
  Law,
  MatchFacts,
  MatchStatType,
  Me,
  Message,
  MessagePage,
  Notification,
  NotificationSettings,
  PaymentRequest,
  Place,
  Poll,
  PollDetails,
  Role,
  UnreadCounts,
  UpdateGroupInput,
  User,
} from './types';

// Spørringer

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me') });

export const useNotificationSettings = () =>
  useQuery({
    queryKey: ['me', 'settings'],
    queryFn: () => api<NotificationSettings>('/me/settings'),
  });

export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/users') });

export const useMyGroups = () =>
  useQuery({ queryKey: ['groups', 'mine'], queryFn: () => api<Group[]>('/groups') });

export const useManagedGroups = () =>
  useQuery({ queryKey: ['groups', 'managed'], queryFn: () => api<Group[]>('/groups/managed') });

export const useGroup = (groupId: string) =>
  useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => api<GroupDetails>(`/groups/${groupId}`),
  });

export const useGroupEvents = (groupId: string, when: 'upcoming' | 'past') =>
  useQuery({
    queryKey: ['events', 'group', groupId, when],
    queryFn: () => api<Event[]>(`/groups/${groupId}/events?when=${when}`),
  });

export const useUpcomingEvents = () =>
  useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => api<Event[]>('/events') });

export const useEvent = (eventId: string) =>
  useQuery({ queryKey: ['events', eventId], queryFn: () => api<Event>(`/events/${eventId}`) });

export const useAnnouncements = (groupId?: string) =>
  useQuery({
    queryKey: ['announcements', groupId ?? 'mine'],
    queryFn: () =>
      api<Announcement[]>(groupId ? `/groups/${groupId}/announcements` : '/announcements'),
  });

export const useAnnouncement = (announcementId: string) =>
  useQuery({
    queryKey: ['announcements', 'detail', announcementId],
    queryFn: () => api<AnnouncementDetails>(`/announcements/${announcementId}`),
  });

export const usePoll = (pollId: string) =>
  useQuery({
    queryKey: ['polls', 'detail', pollId],
    queryFn: () => api<PollDetails>(`/polls/${pollId}`),
  });

export const usePolls = (groupId: string) =>
  useQuery({
    queryKey: ['polls', groupId],
    queryFn: () => api<Poll[]>(`/groups/${groupId}/polls`),
  });

export const useLaws = (groupId: string) =>
  useQuery({ queryKey: ['laws', groupId], queryFn: () => api<Law[]>(`/groups/${groupId}/laws`) });

/** Bøtene i gruppen, side for side (25 om gangen). Hent flere med `fetchNextPage`. */
export const useGroupFines = (groupId: string) =>
  useInfiniteQuery({
    queryKey: ['fines', groupId],
    queryFn: ({ pageParam }) => api<FinesPage>(`/groups/${groupId}/fines?page=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });

export const useFine = (groupId: string, fineId: string) =>
  useQuery({
    queryKey: ['fines', groupId, fineId],
    queryFn: () => api<Fine>(`/fines/${fineId}?groupId=${groupId}`),
  });

/**
 * Innloggingstokenet, for bilder som må hentes med innlogging (bøte- og profilbilder fra
 * tihlde.org). Fornyes av seg selv når det er i ferd med å utløpe.
 */
export const useAccessToken = () =>
  useQuery({
    queryKey: ['access-token'],
    queryFn: () => getValidAccessToken(),
    staleTime: 30_000,
  });

export const useMyFines = () =>
  useQuery({ queryKey: ['fines', 'mine'], queryFn: () => api<Fine[]>('/fines/mine') });

export const useGroupPayments = (groupId: string) =>
  useQuery({
    queryKey: ['payments', groupId],
    queryFn: () => api<PaymentRequest[]>(`/groups/${groupId}/payments`),
  });

export const useFiles = (groupId: string) =>
  useQuery({
    queryKey: ['files', groupId],
    queryFn: () => api<GroupFile[]>(`/groups/${groupId}/files`),
  });

/** Så mange varsler gir API-et om gangen. En full side betyr at det kan finnes eldre. */
const NOTIFICATION_PAGE_SIZE = 100;

/**
 * Varslene, nyeste først. Leste varsler blir liggende, så `fetchNextPage` blar bakover i hele
 * historikken.
 */
export const useNotifications = (groupId?: string) =>
  useInfiniteQuery({
    queryKey: ['notifications', groupId ?? 'all'],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (groupId) params.set('groupId', groupId);
      if (pageParam) params.set('cursor', pageParam);
      const search = params.toString();
      return api<Notification[]>(`/notifications${search ? `?${search}` : ''}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) =>
      page.length === NOTIFICATION_PAGE_SIZE ? (page.at(-1)?.id ?? null) : null,
    select: (data) => data.pages.flat(),
  });

export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<Conversation[]>('/conversations'),
    refetchInterval: 15_000,
  });

export const useConversation = (conversationId: string) =>
  useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: () => api<ConversationDetails>(`/conversations/${conversationId}`),
  });

/** Hvor ofte en åpen samtale ser etter nye meldinger. Erstattes av sanntid (WebSocket) senere. */
const MESSAGE_POLL_MS = 3_000;

/** Meldingene i en samtale, nyeste først. `fetchNextPage` henter eldre meldinger. */
export const useMessages = (conversationId: string) =>
  useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      api<MessagePage>(
        `/conversations/${conversationId}/messages${pageParam ? `?cursor=${pageParam}` : ''}`
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    refetchInterval: MESSAGE_POLL_MS,
  });

export const useContacts = () =>
  useQuery({ queryKey: ['contacts'], queryFn: () => api<User[]>('/contacts') });

export const usePlaces = (groupId: string, q: string) =>
  useQuery({
    queryKey: ['places', groupId, q],
    queryFn: () => api<Place[]>(`/places?groupId=${groupId}&q=${encodeURIComponent(q)}`),
    placeholderData: (previous) => previous,
  });

/** Søk i OpenStreetMap. Kalles først når søket har minst tre tegn. */
export const usePlaceSearch = (q: string) =>
  useQuery({
    queryKey: ['places', 'search', q],
    queryFn: () => api<Place[]>(`/places/search?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 3,
    staleTime: Infinity,
  });

export const useUnreadCounts = () =>
  useQuery({
    queryKey: ['unread'],
    queryFn: () => api<UnreadCounts>('/unread'),
    refetchInterval: 30_000,
  });

// Endringer

/** Endrer varselinnstillinger. Bryterne flyttes med en gang, og settes tilbake hvis det feiler. */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  const key = ['me', 'settings'];
  return useMutation({
    mutationFn: (changes: Partial<NotificationSettings>) =>
      api<NotificationSettings>('/me/settings', { method: 'PATCH', body: changes }),
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationSettings>(key);
      if (previous) queryClient.setQueryData(key, { ...previous, ...changes });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (settings) => queryClient.setQueryData(key, settings),
  });
}

/** «Kommer ikke» krever en begrunnelse (`reason`). */
export function useSetAttendance(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, reason }: { status: Answer; reason?: string }) =>
      api<Event>(`/events/${eventId}/attendance`, { method: 'PUT', body: { status, reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useCreateEvent(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api<Event>(`/groups/${groupId}/events`, { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useCreateAnnouncement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) =>
      api<Announcement>(`/groups/${groupId}/announcements`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useAddComment(announcementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api(`/announcements/${announcementId}/comments`, { method: 'POST', body: { body } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupInput) =>
      api<Group>(`/groups/${groupId}`, { method: 'PATCH', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useSetRole(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api(`/groups/${groupId}/members/${userId}/role`, { method: 'PUT', body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useSetResult(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (score: { ourScore: number | null; theirScore: number | null }) =>
      api<Event>(`/events/${eventId}/result`, { method: 'PUT', body: score }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useSetPosition(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, positionId }: { userId: string; positionId: string | null }) =>
      api(`/groups/${groupId}/members/${userId}/position`, {
        method: 'PUT',
        body: { positionId },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}

/** (Admin) Lag en undergruppe i hovedgruppen `parentId`. */
export function useCreateSubgroup(parentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubgroupInput) =>
      api<Group>(`/groups/${parentId}/subgroups`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });
}

/** (Admin) Slett en undergruppe med alt i den. */
export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/groups/${groupId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/** (Admin) Bestem hvem som er med i en undergruppe. */
export function useSetSubgroupMembers(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api(`/groups/${groupId}/members`, { method: 'PUT', body: { userIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/** Kampfakta for en kamp: lagets hendelsestyper og hendelsene som er registrert. */
export const useMatchFacts = (eventId: string) =>
  useQuery({
    queryKey: ['events', eventId, 'match-facts'],
    queryFn: () => api<MatchFacts>(`/events/${eventId}/match-facts`),
  });

/** (Sub-/admin) Registrer og fjern hendelser på en kamp. Svaret er hele kampfaktaen. */
export function useMatchStatMutations(eventId: string) {
  const queryClient = useQueryClient();
  const onSuccess = (facts: MatchFacts) =>
    queryClient.setQueryData(['events', eventId, 'match-facts'], facts);
  const path = `/events/${eventId}/match-facts`;
  return {
    add: useMutation({
      mutationFn: (stat: { typeId: string; userId: string }) =>
        api<MatchFacts>(path, { method: 'POST', body: stat }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (statId: string) => api<MatchFacts>(`${path}/${statId}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

/** (Admin i hovedgruppen) Legg til, gi nytt navn, flytt og slett hendelsestyper i kampfakta. */
export function useMatchStatTypeMutations(groupId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };
  const path = `/groups/${groupId}/match-stat-types`;
  return {
    create: useMutation({
      mutationFn: (name: string) => api<MatchStatType>(path, { method: 'POST', body: { name } }),
      onSuccess,
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api(`${path}/${id}`, { method: 'PATCH', body: { name } }),
      onSuccess,
    }),
    move: useMutation({
      mutationFn: ({ id, move }: { id: string; move: 'up' | 'down' }) =>
        api(`${path}/${id}`, { method: 'PATCH', body: { move } }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`${path}/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

/** (Admin) Legg til, gi nytt navn, flytt og slett posisjoner i gruppens posisjonsliste. */
export function usePositionMutations(groupId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
  const path = `/groups/${groupId}/positions`;
  return {
    create: useMutation({
      mutationFn: (name: string) => api<GroupPosition>(path, { method: 'POST', body: { name } }),
      onSuccess,
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api(`${path}/${id}`, { method: 'PATCH', body: { name } }),
      onSuccess,
    }),
    move: useMutation({
      mutationFn: ({ id, move }: { id: string; move: 'up' | 'down' }) =>
        api(`${path}/${id}`, { method: 'PATCH', body: { move } }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`${path}/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
  };
}

/** (Sub-/admin) Gjør et medlem inaktivt med en begrunnelse, eller aktivt igjen med `null`. */
export function useSetInactive(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string | null }) =>
      api(`/groups/${groupId}/members/${userId}/inactive`, { method: 'PUT', body: { reason } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['me'], exact: true });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      api<Event>(`/events/${eventId}`, { method: 'PUT', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useDeleteEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      // Hopp over det slettede arrangementet, ellers hentes det på nytt (404) mens skjermen lukkes.
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) => queryKey[0] === 'events' && queryKey[1] !== eventId,
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Send en melding, eventuelt som svar på en annen. Vises med en gang (optimistisk) og byttes ut
 * med svaret fra serveren.
 */
export function useSendMessage(conversationId: string, me: User) {
  const queryClient = useQueryClient();
  const key = ['messages', conversationId];

  return useMutation({
    mutationFn: ({ body, replyTo }: { body: string; replyTo: Message | null }) =>
      api<Message>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { body, replyToId: replyTo?.id ?? null },
      }),
    onMutate: async ({ body, replyTo }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData<InfiniteData<MessagePage>>(key, (data) => {
        if (!data) return data;
        const temp: Message = {
          id: tempId,
          conversationId,
          sender: me,
          body,
          sentAt: new Date().toISOString(),
          deleted: false,
          edited: false,
          reactions: [],
          replyTo: replyTo && {
            id: replyTo.id,
            senderName: replyTo.sender.name,
            body: replyTo.body,
            deleted: replyTo.deleted,
          },
        };
        const [first, ...rest] = data.pages;
        return { ...data, pages: [{ ...first, messages: [temp, ...first.messages] }, ...rest] };
      });
      return { tempId };
    },
    onError: (_error, _body, context) => {
      // Ta bort den midlertidige meldingen igjen.
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        key,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              messages: p.messages.filter((m) => m.id !== context?.tempId),
            })),
          }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Slår brukerens reaksjon av eller på. Vises med en gang. */
export function useReactToMessage(conversationId: string, me: User) {
  const queryClient = useQueryClient();
  const key = ['messages', conversationId];

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api<Message>(`/conversations/${conversationId}/messages/${messageId}/reactions`, {
        method: 'POST',
        body: { emoji },
      }),
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagePage>>(key);
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        key,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.id === messageId ? { ...m, reactions: toggleReaction(m.reactions, emoji, me) } : m
              ),
            })),
          }
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

function toggleReaction(reactions: Message['reactions'], emoji: string, me: User) {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) return [...reactions, { emoji, count: 1, mine: true, users: [me] }];
  if (existing.mine && existing.count === 1) return reactions.filter((r) => r.emoji !== emoji);
  return reactions.map((r) =>
    r.emoji === emoji
      ? {
          ...r,
          count: r.count + (r.mine ? -1 : 1),
          mine: !r.mine,
          users: r.mine ? r.users.filter((u) => u.id !== me.id) : [...r.users, me],
        }
      : r
  );
}

/** Rediger teksten i en av sine egne meldinger. Den nye teksten vises med en gang. */
export function useEditMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const key = ['messages', conversationId];

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api<Message>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PATCH',
        body: { body },
      }),
    onMutate: async ({ messageId, body }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagePage>>(key);
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        key,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => ({
                ...m,
                ...(m.id === messageId && { body, edited: true }),
                ...(m.replyTo?.id === messageId && { replyTo: { ...m.replyTo, body } }),
              })),
            })),
          }
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Slett en av sine egne meldinger. Vises som slettet med en gang. */
export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const key = ['messages', conversationId];
  const markDeleted = (m: Message, id: string): Message => ({
    ...m,
    ...(m.id === id && { body: '', deleted: true }),
    ...(m.replyTo?.id === id && { replyTo: { ...m.replyTo, body: '', deleted: true } }),
  });

  return useMutation({
    mutationFn: (messageId: string) =>
      api<Message>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
      }),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<InfiniteData<MessagePage>>(key);
      queryClient.setQueryData<InfiniteData<MessagePage>>(
        key,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => markDeleted(m, messageId)),
            })),
          }
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/conversations/${conversationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread'] });
    },
  });
}

/** Åpner (eller lager) en direktemelding med en person og gir tilbake samtale-id-en. */
export function useStartDirectMessage() {
  return useMutation({
    mutationFn: (userId: string) =>
      api<{ id: string }>('/conversations/direct', { method: 'POST', body: { userId } }),
  });
}

export function useCollectiveFine(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<{ count: number }>(`/events/${eventId}/collective-fine`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      // Arrangementet vet nå at fellesbot er gitt, så knappen forsvinner.
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/** Setter brukerens stemme. Listen erstatter tidligere stemmer, tom liste fjerner stemmen. */
export function useVote(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (optionIds: string[]) =>
      api<Poll>(`/polls/${pollId}/vote`, { method: 'PUT', body: { optionIds } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useCreatePoll(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePollInput) =>
      api<Poll>(`/groups/${groupId}/polls`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useAddPollComment(pollId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api(`/polls/${pollId}/comments`, { method: 'POST', body: { body } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useGiveFines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GiveFinesInput) =>
      api<{ count: number }>('/fines', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fines'] }),
  });
}

/** Godkjenn, marker som betalt eller avvis en bot fra tihlde.org (botsjef og leder). */
export function useSetFineStatus(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fineId, status }: { fineId: string; status: FineStatus }) =>
      api(`/fines/${fineId}`, { method: 'PATCH', body: { groupId, status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fines'] }),
  });
}

export function useCreatePayment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) =>
      api<PaymentRequest>(`/groups/${groupId}/payments`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments', groupId] }),
  });
}

export function useSetPaid(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paid: boolean) =>
      api<PaymentRequest>(`/payments/${paymentId}/paid`, { method: 'PUT', body: { paid } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
}

/** (Sub-/admin) Godkjenn eller avvis et medlems «Jeg har betalt». */
export function useReviewPayment(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'approved' | 'rejected' }) =>
      api<PaymentRequest>(`/payments/${paymentId}/confirmations/${userId}`, {
        method: 'PUT',
        body: { status },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api(`/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread'] });
    },
  });
}
