import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, useSetRole } from '@/data/hooks';
import type { Role } from '@/data/types';
import { ROLES } from '@/lib/roles';

/** (Admin) Velg rolle for et medlem. */
export default function VelgRolleScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const group = useGroup(groupId).data;
  const member = group?.members.find((m) => m.user.id === userId);
  // Botsjef gir fellesbot, og bøtene hører til hovedgruppen.
  const roles = ROLES.filter((role) => role.value !== 'botsjef' || !group?.parentId);
  const setRole = useSetRole(groupId);

  const choose = (role: Role) => {
    if (role === member?.role) return router.back();
    setRole.mutate(
      { userId, role },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke endre rollen', error.message),
      }
    );
  };

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4">Rolle</Text>
      {member && <Text className="text-muted-foreground pb-2 text-sm">{member.user.name}</Text>}
      {roles.map((role, index) => (
        <View key={role.value}>
          {index > 0 && <Separator />}
          <Pressable
            disabled={setRole.isPending}
            onPress={() => choose(role.value)}
            className="flex-row items-center gap-3 py-3.5 active:opacity-70">
            <View className="flex-1">
              <Text className="font-medium">{role.label}</Text>
              <Text className="text-muted-foreground text-sm">{role.description}</Text>
            </View>
            {member?.role === role.value && <Icon as={Check} size={18} className="text-brand" />}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
