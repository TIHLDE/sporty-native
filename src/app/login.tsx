import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { TihldeLogo } from '@/components/sporty/tihlde-logo';
import { Text } from '@/components/ui/text';
import { useSession } from '@/data/session';
import { getRedirectUri } from '@/lib/auth/photon';

/**
 * Innloggingen. Passordet skrives inn på tihlde.org, aldri i appen. Når innloggingen er ferdig,
 * bytter Stack.Protected i rot-layouten over til appen av seg selv.
 */
export default function LoginScreen() {
  const { signIn } = useSession();
  const [pending, setPending] = useState(false);

  const onPress = async () => {
    setPending(true);
    try {
      await signIn();
    } catch (error) {
      Alert.alert('Kunne ikke logge inn', (error as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="flex-grow px-6">
      <View className="mb-10 mt-32 items-center">
        <TihldeLogo size="large" />
      </View>

      <View className="mb-8">
        <Text className="text-3xl font-bold tracking-tight">Velkommen</Text>
        <Text className="text-muted-foreground mt-1.5 text-base">
          Du sendes til tihlde.org for å logge inn
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        disabled={pending}
        className={
          pending
            ? 'bg-brand/40 h-14 items-center justify-center rounded-2xl'
            : 'bg-brand h-14 items-center justify-center rounded-2xl active:opacity-80'
        }>
        {pending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">Logg inn med TIHLDE</Text>
        )}
      </Pressable>

      <View className="mt-6 items-center">
        <Pressable
          hitSlop={8}
          onPress={() => WebBrowser.openBrowserAsync('https://tihlde.org/forgot-password')}>
          <Text className="text-sm">Glemt passord?</Text>
        </Pressable>
      </View>

      {__DEV__ && (
        // Må stå som redirect URI på OAuth-klienten. Endres i Expo Go når Macen får ny IP.
        <Text selectable className="text-muted-foreground mt-auto pb-10 text-center text-xs">
          Redirect URI: {getRedirectUri()}
        </Text>
      )}
    </ScrollView>
  );
}
