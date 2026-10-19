import { Stack } from 'expo-router';

import { CancelButton } from '@/components/sporty/cancel-button';
import { EventDraftProvider } from '@/data/event-draft';

// Flyt: velg gruppe (hele gruppen eller en undergruppe) → skjema → (stedsvelger).
export default function NyttArrangementLayout() {
  return (
    <EventDraftProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerBackTitle: 'Tilbake',
          headerRight: () => <CancelButton />,
        }}>
        <Stack.Screen name="index" options={{ title: 'Lag arrangement for' }} />
        <Stack.Screen name="detaljer" options={{ title: 'Nytt arrangement' }} />
        <Stack.Screen name="sted" options={{ title: 'Velg sted', headerRight: undefined }} />
      </Stack>
    </EventDraftProvider>
  );
}
