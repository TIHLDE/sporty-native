import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NotificationsManager } from '@/components/notifications-manager';
import { loadAppearancePreference } from '@/data/appearance';
import { loadCalendarSettings } from '@/data/calendar-settings';
import { SessionProvider } from '@/data/session';
import { NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
// Bruk lagret Lys/Mørk/Automatisk så tidlig som mulig, før skjermene tegnes.
loadAppearancePreference();
loadCalendarSettings();

export default function RootLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <KeyboardProvider>
      <ThemeProvider value={NAV_THEME[colorScheme]}>
        <SessionProvider>
          <AnimatedSplashOverlay />
          <NotificationsManager />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="opprett"
              options={{
                // Arket har egen tittel i innholdet: med fitToContents legger iOS ellers
                // headeren oppå innholdet.
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="utseende"
              options={{
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="ny-kunngjoring"
              options={{ title: 'Ny kunngjøring', presentation: 'modal' }}
            />
            <Stack.Screen
              name="ny-avstemning"
              options={{ title: 'Ny avstemning', presentation: 'modal' }}
            />
            <Stack.Screen
              name="velg-rolle"
              options={{
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="resultat"
              options={{
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="velg-stilling"
              options={{
                // Egen tittel i innholdet, se "opprett".
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen
              name="inaktiv"
              options={{
                // Egen tittel i innholdet, se "opprett".
                headerShown: false,
                presentation: 'formSheet',
                sheetAllowedDetents: 'fitToContents',
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen name="gi-bot"options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen
              name="nytt-arrangement"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="bytt-bruker"
              options={{
                title: 'Bytt bruker',
                presentation: 'formSheet',
                sheetAllowedDetents: [0.7, 1],
              }}
            />
            <Stack.Screen
              name="test-varsler"
              options={{
                title: 'Test varsler',
                presentation: 'formSheet',
                sheetAllowedDetents: [0.7, 1],
              }}
            />
            <Stack.Screen
              name="ny-betaling"
              options={{ title: 'Ny betaling', presentation: 'modal' }}
            />
          </Stack>
          <PortalHost />
        </SessionProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
