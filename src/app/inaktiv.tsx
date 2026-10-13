import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useGroup, useSetInactive } from '@/data/hooks';

/** (Sub-/admin) Gjør et medlem inaktivt med en begrunnelse, endre begrunnelsen, eller gjør aktivt igjen. */
export default function InaktivScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const member = useGroup(groupId).data?.members.find((m) => m.user.id === userId);
  const setInactive = useSetInactive(groupId);
  const [reason, setReason] = useState(member?.inactive?.reason ?? '');

  const save = (value: string | null) =>
    setInactive.mutate(
      { userId, reason: value },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre', error.message),
      }
    );

  return (
    <View className="gap-5 px-4 pb-8 pt-6">
      <View>
        <Text variant="h4">{member?.inactive ? 'Inaktivt medlem' : 'Gjør inaktiv'}</Text>
        {member && <Text className="text-muted-foreground text-sm">{member.user.name}</Text>}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium">Begrunnelse</Text>
        <Textarea
          value={reason}
          onChangeText={setReason}
          placeholder="F.eks. skadet ut sesongen, permisjon, flyttet"
          maxLength={500}
          numberOfLines={4}
        />
        <Text className="text-muted-foreground text-xs">
          Lagres på profilen til medlemmet. Bare medlemmet og sub-/admin ser begrunnelsen.
        </Text>
      </View>

      <Button
        size="lg"
        className="bg-brand active:bg-brand/80 rounded-full"
        disabled={!reason.trim() || setInactive.isPending}
        onPress={() => save(reason)}>
        <Text className="text-white">
          {member?.inactive ? 'Lagre begrunnelse' : 'Gjør inaktiv'}
        </Text>
      </Button>
      {member?.inactive && (
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={setInactive.isPending}
          onPress={() => save(null)}>
          <Text>Gjør aktiv igjen</Text>
        </Button>
      )}
    </View>
  );
}
