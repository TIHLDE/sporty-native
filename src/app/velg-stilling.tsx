import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, useSetPosition } from '@/data/hooks';
import type { Position } from '@/data/types';
import { POSITIONS } from '@/lib/positions';

/** (Sub-/admin) Velg stilling for en spiller. */
export default function VelgStillingScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const member = useGroup(groupId).data?.members.find((m) => m.user.id === userId);
  const setPosition = useSetPosition(groupId);

  const choose = (position: Position | null) =>
    setPosition.mutate(
      { userId, position },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre stilling', error.message),
      }
    );

  const options: { value: Position | null; label: string }[] = [
    ...POSITIONS,
    { value: null, label: 'Ingen stilling' },
  ];

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4">Stilling</Text>
      {member && <Text className="text-muted-foreground pb-2 text-sm">{member.user.name}</Text>}
      {options.map((option, index) => {
        const selected = (member?.position ?? null) === option.value;
        return (
          <View key={option.label}>
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
    </View>
  );
}
