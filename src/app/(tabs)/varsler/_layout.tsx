import { Stack } from 'expo-router';

export default function VarslerLayout() {
  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: 'Varsler' }} />
    </Stack>
  );
}
