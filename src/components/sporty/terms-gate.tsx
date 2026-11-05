import { openBrowserAsync } from 'expo-web-browser';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useMe } from '@/data/hooks';
import { useAcceptTerms } from '@/data/moderation';
import { useSession } from '@/data/session';
import { PRIVACY_URL, TERMS_SECTIONS } from '@/lib/terms';

/** Selve vilkårsteksten. */
export function TermsText() {
  return (
    <View className="gap-4">
      {TERMS_SECTIONS.map((section) => (
        <View key={section.title} className="gap-1">
          <Text className="font-semibold">{section.title}</Text>
          <Text className="text-muted-foreground text-sm leading-5">{section.body}</Text>
        </View>
      ))}
      <Pressable
        onPress={() => openBrowserAsync(PRIVACY_URL)}
        accessibilityRole="link"
        className="active:opacity-70">
        <Text className="text-brand text-sm font-medium">Les personvernerklæringen</Text>
      </Pressable>
    </View>
  );
}

/** Dekker appen til brukeren har godtatt gjeldende vilkår. */
export function TermsGate() {
  const me = useMe();
  const accept = useAcceptTerms();
  const { signOut } = useSession();
  const insets = useSafeAreaInsets();

  if (!me.data || me.data.termsAccepted) return null;

  return (
    <View
      className="bg-background absolute inset-0 z-[900]"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}>
      <ScrollView contentContainerClassName="gap-4 p-6">
        <Text variant="h3">Brukervilkår</Text>
        <Text className="text-muted-foreground">Du må godta vilkårene for å bruke Sporty.</Text>
        <TermsText />
      </ScrollView>
      <View className="gap-2 px-6 pt-2">
        <Button
          className="bg-brand active:bg-brand/80 rounded-full"
          disabled={accept.isPending}
          onPress={() =>
            accept.mutate(undefined, {
              onError: (error) => Alert.alert('Vilkårene ble ikke lagret', error.message),
            })
          }>
          <Text className="text-white">Jeg godtar vilkårene</Text>
        </Button>
        <Button variant="ghost" className="rounded-full" onPress={() => signOut()}>
          <Text>Logg ut</Text>
        </Button>
      </View>
    </View>
  );
}
