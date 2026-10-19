// Liten fetch-wrapper for API-et. I utvikling er EXPO_PUBLIC_API_URL tom, og relative URL-er
// går automatisk til Expo-dev-serveren som kjører API-rutene i src/app/api.

import Constants from 'expo-constants';

import type { UploadedFile } from '@/data/types';

import { getValidAccessToken } from './auth/photon';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api`;

/**
 * Full adresse til serveren. Trengs der en relativ URL ikke holder, f.eks. bilder, video og
 * vedlegg som åpnes i nettleseren. I utvikling er det dev-serveren (samme som Metro).
 */
const ORIGIN =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.hostUri ? `http://${Constants.expoConfig.hostUri}` : '');

/** Gjør en relativ sti fra API-et (f.eks. UploadedFile.url) om til en full URL. */
export function fileUrl(path: string) {
  return `${ORIGIN}${path}`;
}

/** Kun i utvikling: brukeren vi opptrer som (Bytt bruker). Settes av SessionProvider. */
let actAsUserId: string | null = null;

export function setApiActAs(userId: string | null) {
  actAsUserId = userId;
}

/** Kalles når sesjonen er borte for godt, så appen kan sende brukeren til innloggingen. */
let onSessionLost: () => void = () => {};

export function setOnSessionLost(listener: () => void) {
  onSessionLost = listener;
}

async function authHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const token = await getValidAccessToken({ forceRefresh });
  if (!token) {
    onSessionLost();
    throw new ApiError(401, 'Du må logge inn på nytt');
  }
  return {
    authorization: `Bearer ${token}`,
    ...(actAsUserId ? { 'x-act-as': actAsUserId } : {}),
  };
}

/**
 * Sender en forespørsel med innloggingen. Svarer serveren 401, fornyes tokenet og forespørselen
 * prøves én gang til (tokenet kan ha blitt avvist før det utløp på klokka vår).
 */
async function authedFetch(url: string, init: RequestInit = {}) {
  const send = async (forceRefresh: boolean) =>
    fetch(url, {
      ...init,
      headers: { ...(init.headers as object), ...(await authHeaders(forceRefresh)) },
    });
  const response = await send(false);
  if (response.status !== 401) return response;
  const retry = await send(true);
  if (retry.status === 401) onSessionLost();
  return retry;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {}
): Promise<T> {
  const response = await authedFetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: options.body !== undefined ? { 'content-type': 'application/json' } : {},
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error ?? `Forespørselen feilet (${response.status})`);
  }
  return response.json() as Promise<T>;
}

/** Laster opp en lokal fil (fra bilde- eller filvelgeren) og returnerer den lagrede filen. */
export async function uploadFile(file: { uri: string; name: string; mimeType: string }) {
  const form = new FormData();
  // React Native sender filen fra `uri` når den legges ved på denne formen.
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);

  const response = await authedFetch(`${BASE_URL}/uploads`, { method: 'POST', body: form });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error ?? `Opplastingen feilet (${response.status})`);
  }
  return response.json() as Promise<UploadedFile>;
}

/** Henter en tekstfil fra API-et (f.eks. CSV-eksport), med filnavnet serveren foreslår. */
export async function downloadText(path: string) {
  const response = await authedFetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error ?? `Nedlastingen feilet (${response.status})`);
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  const fileName = decodeURIComponent(
    disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? 'eksport.csv'
  );
  return { fileName, text: await response.text() };
}
