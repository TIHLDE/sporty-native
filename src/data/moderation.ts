// Rapportering av meldinger og blokkering av personer. Samme regler som i Sporty v3, der
// serveren håndhever dem.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MessageReport, ReportReason, User } from '@/data/types';
import { api } from '@/lib/api';

const REPORTS_KEY = ['reports'];
const BLOCKS_KEY = ['blocks'];

/** Åpne rapporter brukeren kan behandle. Tom liste for alle uten sub-/admin-rolle. */
export const useReports = () =>
  useQuery({ queryKey: REPORTS_KEY, queryFn: () => api<MessageReport[]>('/reports') });

export const useBlockedUsers = () =>
  useQuery({ queryKey: BLOCKS_KEY, queryFn: () => api<User[]>('/blocks') });

export const useReportMessage = (conversationId: string) =>
  useMutation({
    mutationFn: ({ messageId, reason }: { messageId: string; reason: ReportReason }) =>
      api(`/conversations/${conversationId}/messages/${messageId}/report`, {
        method: 'POST',
        body: { reason },
      }),
  });

export const useReportComment = () =>
  useMutation({
    mutationFn: (input: {
      type: 'announcement' | 'poll';
      commentId: string;
      reason: ReportReason;
    }) => api('/reports', { method: 'POST', body: input }),
  });

/** Brukeren godtar gjeldende vilkår. Når /me er hentet på nytt, forsvinner vilkårsskjermen. */
export function useAcceptTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api('/me/terms', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: 'remove' | 'dismiss' }) =>
      api(`/reports/${reportId}`, { method: 'PATCH', body: { action } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Blokkering endrer hva man ser i samtalene, så alt om meldinger hentes på nytt. */
function useInvalidateAfterBlock() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: BLOCKS_KEY });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['unread'] });
    // Kommentarene hentes sammen med kunngjøringen eller avstemningen.
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
    queryClient.invalidateQueries({ queryKey: ['polls'] });
  };
}

export function useBlockUser() {
  const invalidate = useInvalidateAfterBlock();

  return useMutation({
    mutationFn: (userId: string) => api('/blocks', { method: 'POST', body: { userId } }),
    onSuccess: invalidate,
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateAfterBlock();

  return useMutation({
    mutationFn: (userId: string) => api(`/blocks/${userId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
