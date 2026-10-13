// Varsler på telefonen: tillatelse, push-token (bøter sendes fra serveren) og lokale påminnelser
// før arrangementer, som planlegges på enheten og derfor også virker i Expo Go på iOS.

import Constants, { ExecutionEnvironment } from 'expo-constants';
import type {
  NotificationContentInput,
  NotificationPermissionsStatus,
} from 'expo-notifications';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import type { Event } from '@/data/types';

import { api } from './api';
import {
  REMINDER_LEAD_MS,
  eventStartContent,
  signupDeadlineContent,
  type NotificationContent,
} from './notification-content';

/**
 * Expo Go på Android har ikke expo-notifications, og modulen kaster en feil allerede når den
 * importeres. Der lastes den ikke i det hele tatt, og alle varselfunksjonene under gjør ingenting.
 */
export const notificationsSupported = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

/** expo-notifications, eller null der varsler ikke støttes. Bruk denne i stedet for å importere modulen. */
export const Notifications: typeof import('expo-notifications') | null = notificationsSupported
  ? // Må være require: en vanlig import lastes alltid, også der modulen kaster en feil.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-notifications')
  : null;

const CHANNEL_ID = 'default';
/** Alle påminnelser får id med dette prefikset, så de kan byttes ut uten å røre andre varsler. */
const REMINDER_PREFIX = 'reminder:';
/** iOS beholder bare 64 planlagte varsler per app, så vi planlegger bare de nærmeste. */
const MAX_REMINDERS = 60;

// Vis varsler også når appen er åpen.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Om telefonen tillater varsler fra appen. 'undetermined' betyr at vi ikke har spurt ennå, og
 * 'unsupported' at varsler ikke finnes der appen kjører (Expo Go på Android).
 */
export type NotificationPermission = 'undetermined' | 'granted' | 'denied' | 'unsupported';

let permission: NotificationPermission = notificationsSupported ? 'undetermined' : 'unsupported';
const permissionListeners = new Set<() => void>();

function setPermission(response: NotificationPermissionsStatus) {
  permission = response.granted ? 'granted' : response.canAskAgain ? 'undetermined' : 'denied';
  permissionListeners.forEach((listener) => listener());
  return response.granted;
}

/** Spør om tillatelse (én gang) og lager Android-kanalen. Returnerer om varsler er tillatt. */
export async function ensureNotificationPermission() {
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    // Android 13+ viser ikke tillatelsesdialogen før en kanal finnes.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Varsler',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return setPermission(current);
  return setPermission(await Notifications.requestPermissionsAsync());
}

// Brukeren kan ha endret tillatelsen i innstillingene på telefonen mens appen var i bakgrunnen.
AppState.addEventListener('change', (state) => {
  if (state === 'active') Notifications?.getPermissionsAsync().then(setPermission);
});

export function useNotificationPermission() {
  return useSyncExternalStore(
    (listener) => {
      permissionListeners.add(listener);
      return () => permissionListeners.delete(listener);
    },
    () => permission
  );
}

/**
 * Registrerer enhetens Expo push-token på brukeren, så serveren kan sende push (bøter).
 * Krever et EAS-prosjekt (extra.eas.projectId), og på Android en development build.
 */
export async function registerPushToken() {
  if (!Notifications) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__)
      console.info('[push] Mangler EAS projectId, så push er av. Kjør `bunx eas-cli init`.');
    return null;
  }
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await api('/push-tokens', {
      method: 'POST',
      body: { token, platform: Platform.OS },
    });
    return token;
  } catch (error) {
    // F.eks. iOS-simulator uten push-støtte. Påminnelsene virker likevel.
    if (__DEV__) console.info('[push] Fikk ikke push-token:', (error as Error).message);
    return null;
  }
}

/** Hvilke påminnelser brukeren vil ha, fra varselinnstillingene. */
export interface ReminderOptions {
  eventStart: boolean;
  signupDeadline: boolean;
}

interface Reminder {
  id: string;
  date: Date;
  content: NotificationContent;
}

/**
 * Påminnelsene brukeren skal ha: 1 time før hvert arrangement, og 1 time før påmeldingsfristen
 * hvis brukeren ikke har svart ennå.
 */
export function buildReminders(
  events: Event[],
  userId: string,
  options: ReminderOptions,
  now = Date.now()
): Reminder[] {
  const reminders: Reminder[] = [];
  for (const event of events) {
    const startAt = new Date(event.start).getTime() - REMINDER_LEAD_MS;
    if (options.eventStart && startAt > now) {
      reminders.push({
        id: `${REMINDER_PREFIX}start:${event.id}`,
        date: new Date(startAt),
        content: eventStartContent(event),
      });
    }

    const unanswered = event.memberIds.includes(userId) && !event.attendance[userId];
    if (options.signupDeadline && event.signupDeadline && unanswered) {
      const deadlineAt = new Date(event.signupDeadline).getTime() - REMINDER_LEAD_MS;
      if (deadlineAt > now) {
        reminders.push({
          id: `${REMINDER_PREFIX}signup:${event.id}`,
          date: new Date(deadlineAt),
          content: signupDeadlineContent({
            ...event,
            signupDeadline: event.signupDeadline,
          }),
        });
      }
    }
  }
  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, MAX_REMINDERS);
}

/** Bytter ut alle planlagte påminnelser med de som gjelder nå (kalles når arrangementene endres). */
export async function syncReminders(events: Event[], userId: string, options: ReminderOptions) {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
  for (const reminder of buildReminders(events, userId, options)) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        ...toNotificationContent(reminder.content),
        data: { url: reminder.content.url, at: reminder.date.toISOString() },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

/** Planlagte påminnelser, nærmeste først. Brukes av dev-skjermen. */
export async function getScheduledReminders() {
  if (!Notifications) return [];
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
    .map((n) => ({
      id: n.identifier,
      title: n.content.title ?? '',
      // Tidspunktet ligger i data, siden formen på trigger varierer mellom iOS og Android.
      at: typeof n.content.data?.at === 'string' ? n.content.data.at : null,
    }))
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));
}

/** Viser et varsel om `delaySeconds` sekunder. Brukes av dev-skjermen. */
export async function showNotification(content: NotificationContent, delaySeconds = 0) {
  if (!Notifications) throw new Error('Varsler virker ikke i Expo Go på Android.');
  return Notifications.scheduleNotificationAsync({
    content: toNotificationContent(content),
    trigger:
      delaySeconds > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySeconds,
            channelId: CHANNEL_ID,
          }
        : null,
  });
}

function toNotificationContent(content: NotificationContent): NotificationContentInput {
  return {
    title: content.title,
    body: content.body,
    data: { url: content.url },
    sound: 'default',
  };
}
