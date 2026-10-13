// Legger arrangementer inn i en kalender på telefonen (iOS Kalender, Google Kalender osv.).
// expo-calendar finnes ikke i Expo Go, så dette krever en development build.

import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EntityTypes,
  ExpoCalendar,
  ExpoCalendarEvent,
  getCalendarPermissions,
  getCalendars,
  requestCalendarPermissions,
} from 'expo-calendar';
import { Platform } from 'react-native';

import type { CalendarSettings } from '@/data/calendar-settings';
import type { Event } from '@/data/types';

/** Hvilke kalenderhendelser vi har laget, per arrangement, så de kan oppdateres og fjernes. */
const STORAGE_KEY = 'sporty.calendar-events';
/** Lengden på arrangementer uten sluttid (samme som standarden i skjemaet). */
const DEFAULT_DURATION_MS = 90 * 60 * 1000;

interface SyncedEvent {
  calendarEventId: string;
  calendarId: string;
  start: string;
  /** Innholdet sist det ble skrevet, så vi bare oppdaterer når noe faktisk er endret. */
  signature: string;
}

export function isCalendarAvailable() {
  return (
    Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

/** Spør om kalendertilgang hvis vi ikke har den. Returnerer om tilgang er gitt. */
export async function requestCalendarAccess() {
  const current = await getCalendarPermissions();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await requestCalendarPermissions()).granted;
}

export interface WritableCalendar {
  id: string;
  title: string;
  color: string | undefined;
  /** Kontoen kalenderen hører til, f.eks. iCloud eller en Google-konto. */
  account: string;
}

/** Kalenderne vi kan legge arrangementer i. */
export async function getWritableCalendars(): Promise<WritableCalendar[]> {
  const calendars = await getCalendars(EntityTypes.EVENT);
  return calendars
    .filter((c) => c.allowsModifications)
    .map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color,
      account: c.source?.name ?? '',
    }))
    .sort((a, b) => a.account.localeCompare(b.account) || a.title.localeCompare(b.title));
}

let queue = Promise.resolve();

/**
 * Sørger for at kalenderen har akkurat de arrangementene innstillingene sier: lager nye,
 * oppdaterer endrede og fjerner kommende arrangementer som ikke lenger skal være med (f.eks.
 * når man svarer «Kommer ikke»). Arrangementer som har vært beholdes i kalenderen.
 */
export function syncCalendar(events: Event[], userId: string, settings: CalendarSettings) {
  // Kjør én synkronisering om gangen, ellers kan samme arrangement bli lagt inn to ganger.
  queue = queue
    .then(() => runSync(events, userId, settings))
    .catch((error) => console.warn('[kalender] Synkronisering feilet', error));
  return queue;
}

async function runSync(events: Event[], userId: string, settings: CalendarSettings) {
  if (!isCalendarAvailable()) return;
  if (!(await getCalendarPermissions()).granted) return;

  const synced = await loadSynced();
  const now = Date.now();
  const wanted = new Map<string, Event>();
  if (settings.calendarId) {
    for (const event of events) {
      const answer = event.attendance[userId];
      const unanswered = !answer && event.memberIds.includes(userId);
      if ((answer === 'kommer' && settings.syncAccepted) || (unanswered && settings.syncUnanswered)) {
        wanted.set(event.id, event);
      }
    }
  }

  // Fjern det som ikke lenger skal være med.
  for (const [eventId, entry] of Object.entries(synced)) {
    if (wanted.has(eventId) && entry.calendarId === settings.calendarId) continue;
    if (new Date(entry.start).getTime() > now) await deleteCalendarEvent(entry.calendarEventId);
    delete synced[eventId];
  }

  // Legg inn nye og oppdater endrede.
  const calendar = settings.calendarId ? await ExpoCalendar.get(settings.calendarId) : null;
  for (const event of wanted.values()) {
    if (!calendar) break;
    const details = toCalendarDetails(event, !event.attendance[userId]);
    const signature = JSON.stringify(details);
    const entry = synced[event.id];
    if (entry?.signature === signature) continue;

    if (entry) {
      try {
        const existing = await ExpoCalendarEvent.get(entry.calendarEventId);
        await existing.update(details);
        synced[event.id] = { ...entry, start: event.start, signature };
        continue;
      } catch {
        // Hendelsen er slettet i kalenderappen: lag den på nytt under.
      }
    }
    const created = await calendar.createEvent(details);
    synced[event.id] = {
      calendarEventId: created.id,
      calendarId: calendar.id,
      start: event.start,
      signature,
    };
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
}

function toCalendarDetails(event: Event, unanswered: boolean) {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  const notes = [
    event.groupName,
    event.description,
    unanswered ? 'Du har ikke svart ennå. Svar i Sporty.' : '',
  ].filter(Boolean);
  return {
    title: event.opponent ? `${event.title} mot ${event.opponent}` : event.title,
    startDate: start,
    endDate: end,
    location: event.location.name,
    notes: notes.join('\n\n'),
  };
}

async function deleteCalendarEvent(calendarEventId: string) {
  try {
    const existing = await ExpoCalendarEvent.get(calendarEventId);
    await existing.delete();
  } catch {
    // Allerede slettet i kalenderappen.
  }
}

async function loadSynced(): Promise<Record<string, SyncedEvent>> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  try {
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
