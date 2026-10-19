import { Stack } from 'expo-router';

import { CancelButton } from '@/components/sporty/cancel-button';

// Flyt: gruppe → lov → brukere → detaljer.
export default function GiBotLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackTitle: 'Tilbake',
        headerRight: () => <CancelButton />,
      }}>
      <Stack.Screen name="index" options={{ title: 'Velg gruppe' }} />
      <Stack.Screen name="lov" options={{ title: 'Velg lov' }} />
      <Stack.Screen name="brukere" options={{ title: 'Velg brukere' }} />
      <Stack.Screen name="detaljer" options={{ title: 'Gi bot' }} />
    </Stack>
  );
}
