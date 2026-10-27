import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, useSetPosition } from '@/data/hooks';
import { useSession } from '@/data/session';

/** Velg sin egen posisjon i gruppen, f.eks. fra arrangementet. Sub-/admin kan endre den senere. */
export default function MinPosisjonScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { userId } = useSession();
  const group = useGroup(groupId).data;
  const mine = group?.members.find((m) => m.user.id === userId)?.position?.id ?? null;
  const setPosition = useSetPosition(groupId);

  const choose = (positionId: string | null) =>
    setPosition.mutate(
      { userId, positionId },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre posisjon', error.message),
      }
    );

  const options: { value: string | null; label: string }[] = [
    ...(group?.positions ?? []).map((p) => ({ value: p.id, label: p.name })),
    { value: null, label: 'Ingen posisjon' },
  ];

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4">Din posisjon</Text>
      {group && <Text className="text-muted-foreground pb-2 text-sm">{group.name}</Text>}
      {options.map((option, index) => (
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
            {mine === option.value && <Icon as={Check} size={18} className="text-brand" />}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
