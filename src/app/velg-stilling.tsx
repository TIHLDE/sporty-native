import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, useSetPosition } from '@/data/hooks';

/** (Sub-/admin) Velg posisjon for en spiller, fra gruppens egen posisjonsliste. */
export default function VelgStillingScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const group = useGroup(groupId).data;
  const member = group?.members.find((m) => m.user.id === userId);
  const setPosition = useSetPosition(groupId);

  const choose = (positionId: string | null) =>
    setPosition.mutate(
      { userId, positionId },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre stilling', error.message),
      }
    );

  const options: { value: string | null; label: string }[] = [
    ...(group?.positions ?? []).map((p) => ({ value: p.id, label: p.name })),
    { value: null, label: 'Ingen posisjon' },
  ];

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4">Posisjon</Text>
      {member && <Text className="text-muted-foreground pb-2 text-sm">{member.user.name}</Text>}
      {group?.positions.length === 0 && (
        <Text className="text-muted-foreground py-2 text-sm">
          Gruppen har ingen posisjoner ennå. Admin legger dem til under Innstillinger → Posisjoner.
        </Text>
      )}
      {options.map((option, index) => {
        const selected = (member?.position?.id ?? null) === option.value;
        return (
          <View key={option.value ?? 'none'}>
            {index > 0 && <Separator />}
            <Pressable
              disabled={setPosition.isPending}
              onPress={() => choose(option.value)}
              className="flex-row items-center py-3.5 active:opacity-70">
              <Text
                className={
                  option.value === null ? 'text-muted-foreground flex-1' : 'flex-1 font-medium'
                }>
                {option.label}
              </Text>
              {selected && <Icon as={Check} size={18} className="text-brand" />}
            </Pressable>
          </View>
        );
      })}

      <View className="pt-4">
        <Pressable
          onPress={() => router.replace({ pathname: '/inaktiv', params: { groupId, userId } })}
          className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-70">
          <View className="flex-1">
            <Text className="font-medium">
              {member?.inactive ? 'Inaktivt medlem' : 'Gjør inaktiv'}
            </Text>
            {member?.inactive?.reason && (
              <Text className="text-muted-foreground text-sm" numberOfLines={2}>
                {member.inactive.reason}
              </Text>
            )}
          </View>
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        </Pressable>
      </View>
    </View>
  );
}
