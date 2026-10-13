import { Stack } from 'expo-router';

export default function GrupperLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Grupper', headerLargeTitleEnabled: true }} />
      <Stack.Screen
        name="[groupId]/index"
        options={{ headerTransparent: true, headerTintColor: '#fff', title: '' }}
      />
      <Stack.Screen name="[groupId]/medlemmer" options={{ title: 'Medlemmer' }} />
      <Stack.Screen name="[groupId]/innstillinger" options={{ title: 'Innstillinger' }} />
      <Stack.Screen name="[groupId]/roller" options={{ title: 'Roller' }} />
      <Stack.Screen name="[groupId]/undergrupper" options={{ title: 'Undergrupper' }} />
      <Stack.Screen name="[groupId]/varsler" options={{ title: 'Varsler' }} />
      <Stack.Screen name="[groupId]/arrangement/[eventId]" options={{ title: '' }} />
      <Stack.Screen name="[groupId]/kunngjoring/[announcementId]" options={{ title: '' }} />
      <Stack.Screen name="[groupId]/avstemning/[pollId]" options={{ title: '' }} />
    </Stack>
  );
}
