import { Stack } from 'expo-router';

export default function HjemLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Hjem' }} />
      <Stack.Screen
        name="kunngjoring/[announcementId]"
        options={{ title: '', headerLargeTitleEnabled: false, headerBackButtonDisplayMode: 'minimal' }}
      />
      <Stack.Screen
        name="arrangement/[eventId]"
        options={{ title: '', headerLargeTitleEnabled: false, headerBackButtonDisplayMode: 'minimal' }}
      />
    </Stack>
  );
}
