// Kalenderinnstillingene. Lagres på telefonen (ikke på brukeren), fordi kalenderne finnes bare på
// denne enheten. Leses inn når appen starter.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export interface CalendarSettings {
  /** Kalenderen arrangementene legges i, eller null når synkronisering er av. */
  calendarId: string | null;
  /** Navnet på kalenderen, så det kan vises uten å spørre om kalendertilgang. */
  calendarTitle: string | null;
  /** Legg inn arrangementer man har svart «Kommer» på. */
  syncAccepted: boolean;
  /** Legg inn arrangementer man ikke har svart på ennå. */
  syncUnanswered: boolean;
}

const STORAGE_KEY = 'sporty.calendar-settings';

/** `loaded` er false til de lagrede innstillingene er lest inn. */
type CalendarSettingsState = CalendarSettings & { loaded: boolean };

let current: CalendarSettingsState = {
  loaded: false,
  calendarId: null,
  calendarTitle: null,
  syncAccepted: true,
  syncUnanswered: false,
};
const listeners = new Set<() => void>();

function apply(settings: CalendarSettingsState) {
  current = settings;
  listeners.forEach((listener) => listener());
}

export async function loadCalendarSettings() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  let saved: Partial<CalendarSettings> = {};
  try {
    if (stored) saved = JSON.parse(stored);
  } catch {
    // Ugyldig lagret verdi: behold standardvalgene.
  }
  apply({ ...current, ...saved, loaded: true });
}

export function updateCalendarSettings(changes: Partial<CalendarSettings>) {
  const { loaded, ...next } = { ...current, ...changes };
  apply({ ...next, loaded });
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

export function useCalendarSettings() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current
  );
}
