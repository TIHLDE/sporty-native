// Liten fetch-wrapper for API-et. I utvikling er EXPO_PUBLIC_API_URL tom, og relative URL-er
// går automatisk til Expo-dev-serveren som kjører API-rutene i src/app/api.

import Constants from 'expo-constants';

import type { UploadedFile } from '@/data/types';

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

let currentUserId: string | null = null;

/** Settes av SessionProvider. Sendes med hver forespørsel (dev-innlogging). */
export function setApiUserId(userId: string) {
  currentUserId = userId;
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
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(currentUserId ? { 'x-user-id': currentUserId } : {}),
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
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

  const response = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    headers: currentUserId ? { 'x-user-id': currentUserId } : {},
    body: form,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error ?? `Opplastingen feilet (${response.status})`);
  }
  return response.json() as Promise<UploadedFile>;
}

/** Henter en tekstfil fra API-et (f.eks. CSV-eksport), med filnavnet serveren foreslår. */
export async function downloadText(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: currentUserId ? { 'x-user-id': currentUserId } : {},
  });
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
