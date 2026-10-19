import { Stack } from 'expo-router';

export default function ProfilLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="index" options={{ title: 'Profil' }} />
      <Stack.Screen name="innstillinger" options={{ title: 'Innstillinger' }} />
      <Stack.Screen
        name="kalender"
        options={{ title: 'Standardkalender', headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
