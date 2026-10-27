import { router } from 'expo-router';
import { ChevronRight, Shirt } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { UserRow } from '@/components/sporty/user-row';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { GroupDetails, Member } from '@/data/types';

/**
 * Deltakerne delt inn etter posisjon i gruppen, i gruppens rekkefølge (f.eks. Keeper, Forsvar …),
 * så man ser om det mangler noen på en posisjon. De uten posisjon kommer sist.
 */
export function ParticipantsByPosition({
  userIds,
  members,
  positions,
  empty,
}: {
  userIds: string[];
  members: Map<string, Member>;
  positions: GroupDetails['positions'];
  empty: string;
}) {
  const people = userIds.flatMap((id) => members.get(id) ?? []);
  if (people.length === 0) return <EmptyState text={empty} />;

  const sections = [
    ...positions.map((p) => ({
      key: p.id,
      title: p.name,
      members: people.filter((m) => m.position?.id === p.id),
    })),
    { key: 'none', title: 'Uten posisjon', members: people.filter((m) => !m.position) },
  ].filter((section) => section.members.length > 0);

  return (
    <View className="gap-3">
      {sections.map((section) => (
        <View key={section.key}>
          <Text className="text-muted-foreground pb-0.5 text-xs font-medium uppercase">
            {section.title} ({section.members.length})
          </Text>
          {section.members.map((member, index) => (
            <View key={member.user.id}>
              {index > 0 && <Separator />}
              <UserRow user={member.user} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Vises på arrangementet når gruppen bruker posisjoner og man ikke har valgt sin egen. */
export function ChoosePositionPrompt({ groupId }: { groupId: string }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/min-posisjon', params: { groupId } })}
      className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-70">
      <Icon as={Shirt} size={18} className="text-brand" />
      <View className="flex-1">
        <Text className="font-medium">Velg posisjonen din</Text>
        <Text className="text-muted-foreground text-sm">
          Så ser alle hvor du spiller når du kommer
        </Text>
      </View>
      <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
    </Pressable>
  );
}
