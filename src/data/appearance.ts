// Utseende-innstillingen (Automatisk / Lys / Mørk). Settes for hele appen via React Native sin
// Appearance, så både NativeWind-fargene og native deler (fanelinje, dato-velgere, dialoger)
// følger med. Valget lagres på telefonen og leses inn når appen starter.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

export const APPEARANCE_OPTIONS: { value: AppearancePreference; label: string; description: string }[] =
  [
    { value: 'system', label: 'Automatisk', description: 'Følger innstillingen på telefonen' },
    { value: 'light', label: 'Lys', description: 'Alltid lyst utseende' },
    { value: 'dark', label: 'Mørk', description: 'Alltid mørkt utseende' },
  ];

const STORAGE_KEY = 'sporty.appearance';

let current: AppearancePreference = 'system';
const listeners = new Set<() => void>();

function apply(preference: AppearancePreference) {
  current = preference;
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  listeners.forEach((listener) => listener());
}

/** Leser det lagrede valget. Kalles én gang når appen starter. */
export async function loadAppearancePreference() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (stored === 'light' || stored === 'dark' || stored === 'system') apply(stored);
}

export function setAppearancePreference(preference: AppearancePreference) {
  apply(preference);
  AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {});
}

export function useAppearancePreference() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current
  );
}
