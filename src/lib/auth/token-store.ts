// Tokenene fra «Logg inn med TIHLDE», lagret kryptert på telefonen (Keychain / Keystore).

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN = 'sporty_access_token';
const REFRESH_TOKEN = 'sporty_refresh_token';
const EXPIRES_AT = 'sporty_expires_at';

/** Brukes bare når Photon ikke sender `expires_in`. Det er levetiden Photon gir i dag. */
const ASSUMED_LIFETIME_SECONDS = 3600;

export interface StoredSession {
  accessToken: string;
  refreshToken: string | null;
  /** Millisekunder siden epoch. 0 = ukjent, regnes som utløpt. */
  expiresAt: number;
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN),
    SecureStore.getItemAsync(REFRESH_TOKEN),
    SecureStore.getItemAsync(EXPIRES_AT),
  ]);
  if (!accessToken) return null;
  return { accessToken, refreshToken, expiresAt: Number(expiresAt) || 0 };
}

export async function storeSession(session: {
  accessToken: string;
  refreshToken?: string | null;
  expiresInSeconds?: number;
}) {
  const lifetime = session.expiresInSeconds || ASSUMED_LIFETIME_SECONDS;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN, session.accessToken),
    SecureStore.setItemAsync(EXPIRES_AT, String(Date.now() + lifetime * 1000)),
    // Et fornyelsessvar uten refresh token betyr «behold det du har». Å slette det her ville
    // logget brukeren ut ved neste fornyelse.
    ...(session.refreshToken
      ? [SecureStore.setItemAsync(REFRESH_TOKEN, session.refreshToken)]
      : []),
  ]);
}

export async function clearStoredSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN),
    SecureStore.deleteItemAsync(REFRESH_TOKEN),
    SecureStore.deleteItemAsync(EXPIRES_AT),
  ]);
}
