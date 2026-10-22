// Regler for meldinger. Samme som i Sporty v3 (packages/api/src/rest/lib/messages.ts), der
// serveren håndhever dem.

/** Hvor lenge etter sending man kan redigere eller slette en melding. */
export const CHANGE_WINDOW_MS = 15 * 60 * 1000;

/** Emojiene man kan reagere med fra menyen. */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

/** Om meldingen fortsatt kan redigeres eller slettes av den som sendte den. */
export const canStillChange = (sentAt: string | Date, now = Date.now()) =>
  now - new Date(sentAt).getTime() <= CHANGE_WINDOW_MS;
