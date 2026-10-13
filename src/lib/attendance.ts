import type { AttendanceStatus, Event } from '@/data/types';

/** Deler gruppens medlemmer inn etter svar på arrangementet. */
export function summarizeAttendance(event: Event, myUserId: string) {
  const statusOf = (userId: string): AttendanceStatus => event.attendance[userId] ?? 'ubesvart';
  const byStatus = (status: AttendanceStatus) => event.memberIds.filter((id) => statusOf(id) === status);

  return {
    myStatus: statusOf(myUserId),
    kommer: byStatus('kommer'),
    kommerIkke: byStatus('kommer_ikke'),
    ubesvart: byStatus('ubesvart'),
  };
}
