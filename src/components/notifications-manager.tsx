import type { Notification } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { useCalendarSettings } from '@/data/calendar-settings';
import { useNotificationSettings, useUpcomingEvents } from '@/data/hooks';
import { useSession } from '@/data/session';
import { syncCalendar } from '@/lib/calendar-sync';
import {
  Notifications,
  ensureNotificationPermission,
  registerPushToken,
  syncReminders,
  useNotificationPermission,
} from '@/lib/notifications';

/**
 * Usynlig komponent i rot-layouten. Spør om tillatelse, registrerer push-token, holder
 * påminnelsene og kalenderen oppdatert, og åpner riktig skjerm når man trykker på et varsel.
 */
export function NotificationsManager() {
  const { userId } = useSession();
  const events = useUpcomingEvents();
  const settings = useNotificationSettings().data;
  const calendarSettings = useCalendarSettings();
  const allowed = useNotificationPermission() === 'granted';

  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  // Push-tokenet følger brukeren (også når man bytter bruker i utvikling).
  useEffect(() => {
    if (allowed) registerPushToken();
  }, [allowed, userId]);

  // Planlegg påminnelsene på nytt hver gang arrangementene, svarene eller innstillingene endres.
  const remindStart = Boolean(settings?.pushEnabled && settings.pushEventReminders);
  const remindSignup = Boolean(settings?.pushEnabled && settings.pushSignupReminders);
  useEffect(() => {
    if (allowed && events.data && settings) {
      syncReminders(events.data, userId, {
        eventStart: remindStart,
        signupDeadline: remindSignup,
      }).catch((error) => console.warn('[varsler] Kunne ikke planlegge påminnelser', error));
    }
  }, [allowed, events.data, settings, userId, remindStart, remindSignup]);

  useEffect(() => {
    // Vent til innstillingene er lest inn, ellers fjernes alt fra kalenderen ved oppstart.
    if (events.data && calendarSettings.loaded) syncCalendar(events.data, userId, calendarSettings);
  }, [events.data, userId, calendarSettings]);

  useNotificationObserver();
  return null;
}

/** Åpner skjermen i varselets `data.url`, også når appen ble startet ved å trykke på varselet. */
function useNotificationObserver() {
  useEffect(() => {
    if (!Notifications) return;
    const redirect = (notification: Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as Href);
    };

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
      // Ellers åpnes samme skjerm igjen ved neste omlasting.
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((r) =>
      redirect(r.notification)
    );
    return () => subscription.remove();
  }, []);
}
