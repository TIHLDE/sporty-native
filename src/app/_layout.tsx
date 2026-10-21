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
import { SessionProvider, useSession } from '@/data/session';
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
          <RootNavigator />
          <PortalHost />
        </SessionProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}

/** Alt unntatt innloggingen krever at man er logget inn med TIHLDE. */
function RootNavigator() {
  const { status } = useSession();
  const signedIn = status === 'signedIn';

  return (
    <>
      {/* Splash-skjermen står til vi vet om brukeren er logget inn, så innloggingen ikke blinker. */}
      {status !== 'loading' && <AnimatedSplashOverlay />}
      {signedIn && <NotificationsManager />}
      <Stack>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        {/* Tilbake fra tihlde.org. Innloggingen fanger opp adressen selv, ruten finnes bare så
            Expo Router ikke viser «fant ikke siden» hvis den åpnes. */}
        <Stack.Screen name="oauth" options={{ headerShown: false }} />
        <Stack.Protected guard={signedIn}>
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
          <Stack.Screen name="ny-hendelse" options={{ title: 'Ny hendelse', presentation: 'modal' }} />
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
          <Stack.Screen name="gi-bot" options={{ presentation: 'modal', headerShown: false }} />
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
        </Stack.Protected>
      </Stack>
    </>
  );
}
