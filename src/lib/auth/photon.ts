// «Logg inn med TIHLDE» mot Photon, TIHLDE sin OAuth2/OIDC-leverandør. Samme oppsett som
// TIHLDE-appen (github.com/TIHLDE/Native): offentlig klient med PKCE, tokens i SecureStore.

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { clearStoredSession, getStoredSession, storeSession } from './token-store';

// Lukker nettleservinduet når innloggingen sender oss tilbake (trengs på web).
WebBrowser.maybeCompleteAuthSession();

const PHOTON_URL = process.env.EXPO_PUBLIC_PHOTON_URL || 'https://photon.tihlde.org';
const ISSUER = `${PHOTON_URL}/api/auth`;

/**
 * Bilder på tihlde.org sitt eget lager. Profilbilder der er private og hentes med tokenet, og bare
 * dit skal tokenet sendes. Andre lenker er eksterne bilder.
 */
export function isPhotonAsset(url: string) {
  return url.startsWith(`${PHOTON_URL}/api/assets/`);
}

/**
 * Appen er en offentlig klient: alt som ligger i appen kan leses av den som laster den ned, så
 * det finnes ingen klienthemmelighet. PKCE gjør at innloggingskoden er verdiløs uten verifisereren
 * som bare denne telefonen har.
 */
export const CLIENT_ID = process.env.EXPO_PUBLIC_PHOTON_CLIENT_ID ?? '';

const SCOPES = ['openid', 'profile', 'email', 'offline_access'];

/** Uten `resource` gir Photon et opakt token i stedet for en JWT. Må med ved fornyelse også. */
const RESOURCE = ISSUER;

const TOKEN_ENDPOINT = `${ISSUER}/oauth2/token`;
const REVOCATION_ENDPOINT = `${ISSUER}/oauth2/revoke`;

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${ISSUER}/oauth2/authorize`,
  tokenEndpoint: TOKEN_ENDPOINT,
  revocationEndpoint: REVOCATION_ENDPOINT,
};

/**
 * Hvor Photon sender brukeren tilbake. `sportynative://oauth` i en ekte build, og
 * `exp://<IP-en til Macen>:8081/--/oauth` i Expo Go. Begge må stå som redirect URI på klienten.
 */
export function getRedirectUri() {
  return AuthSession.makeRedirectUri({ scheme: 'sportynative', path: 'oauth' });
}

/** Litt før tokenet faktisk utløper, så en forespørsel ikke rekker å utløpe underveis. */
const EXPIRY_SKEW_MS = 60_000;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function requestToken(params: Record<string, string>) {
  return fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, resource: RESOURCE, ...params }).toString(),
  });
}

async function saveTokens(response: Response) {
  const data = (await response.json()) as TokenResponse;
  await storeSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresInSeconds: data.expires_in,
  });
}

/**
 * Åpner tihlde.org i en nettleser og bytter koden mot tokens. Returnerer false hvis brukeren
 * lukket nettleseren, og kaster en feil hvis innloggingen feilet.
 */
export async function signInWithPhoton() {
  if (!CLIENT_ID) throw new Error('Mangler EXPO_PUBLIC_PHOTON_CLIENT_ID i .env');
  const redirectUri = getRedirectUri();
  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    scopes: SCOPES,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);
  if (result.type === 'error') {
    throw new Error(
      result.params.error_description ?? result.error?.message ?? 'Innlogging feilet'
    );
  }
  if (result.type !== 'success' || !result.params.code) return false;

  const response = await requestToken({
    grant_type: 'authorization_code',
    code: result.params.code,
    redirect_uri: redirectUri,
    code_verifier: request.codeVerifier!,
  });
  if (!response.ok) throw new Error(`Innlogging feilet (${response.status})`);
  await saveTokens(response);
  return true;
}

/**
 * Fornyelsen som pågår, om noen. Photon roterer refresh tokenet, og bruker man det samme to
 * ganger tolkes det som tyveri og hele sesjonen slettes. Derfor deler alle på samme kall.
 */
let inFlightRefresh: Promise<string | null> | null = null;

function refreshSession() {
  inFlightRefresh ??= performRefresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

/** Null betyr at sesjonen er avvist og slettet. Kaster hvis Photon ikke svarte. */
async function performRefresh(): Promise<string | null> {
  const stored = await getStoredSession();
  if (!stored?.refreshToken) {
    await clearStoredSession();
    return null;
  }
  const response = await requestToken({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
  });
  // Bare 400 og 401 betyr at tokenet er avvist. En 5xx sier ingenting om sesjonen, og å logge
  // alle ut da ville vært feil.
  if (response.status === 400 || response.status === 401) {
    await clearStoredSession();
    return null;
  }
  if (!response.ok) throw new Error(`Innloggingen svarer ikke akkurat nå (${response.status})`);
  await saveTokens(response);
  return (await getStoredSession())?.accessToken ?? null;
}

/** Et gyldig access token, fornyet først hvis det har utløpt. Null = må logge inn på nytt. */
export async function getValidAccessToken(options: { forceRefresh?: boolean } = {}) {
  const stored = await getStoredSession();
  if (!stored) return null;
  if (!options.forceRefresh && Date.now() < stored.expiresAt - EXPIRY_SKEW_MS) {
    return stored.accessToken;
  }
  return refreshSession();
}

/** Logger ut lokalt og trekker tilbake refresh tokenet hos Photon (best effort). */
export async function signOutOfPhoton() {
  const stored = await getStoredSession();
  await clearStoredSession();
  if (stored?.refreshToken) {
    fetch(REVOCATION_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        token: stored.refreshToken,
        token_type_hint: 'refresh_token',
      }).toString(),
    }).catch(() => {});
  }
}
