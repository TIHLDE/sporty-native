import { Stack } from 'expo-router';

export default function MeldingerLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Meldinger', headerLargeTitleEnabled: true }} />
      <Stack.Screen name="ny" options={{ title: 'Ny melding' }} />
      <Stack.Screen name="[conversationId]" options={{ title: '' }} />
    </Stack>
  );
}
