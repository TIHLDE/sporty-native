import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { GroupAvatar } from '@/components/sporty/group-avatar';
import { QueryState } from '@/components/sporty/query-state';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';
import type { Group, GroupDetails } from '@/data/types';

const isManager = (group: Pick<Group, 'myRole'>) =>
  group.myRole === 'admin' || group.myRole === 'subadmin';

/** Steg 1: lag arrangementet for hele gruppen, eller for en av undergruppene. */
export default function LagArrangementForScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);

  return <QueryState query={group}>{(data) => <TargetList group={data} />}</QueryState>;
}

function TargetList({ group }: { group: GroupDetails }) {
  // Sub-/admin i hovedgruppen kan lage for alle undergrupper, ellers bare der man selv er sub-/admin.
  const subgroups = isManager(group) ? group.subgroups : group.subgroups.filter(isManager);
  const targets = [
    ...(isManager(group)
      ? [{ id: group.id, color: group.color, label: `Alle i ${group.name}` }]
      : []),
    ...subgroups.map((s) => ({ id: s.id, color: s.color, label: s.name })),
  ];

  // Ingen undergrupper å velge mellom: gå rett til skjemaet.
  if (targets.length === 1) {
    return (
      <Redirect
        href={{ pathname: '/nytt-arrangement/detaljer', params: { forGroupId: targets[0].id } }}
      />
    );
  }

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      data={targets}
      keyExtractor={(target) => target.id}
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item, index }) => (
        <Link
          href={{ pathname: '/nytt-arrangement/detaljer', params: { forGroupId: item.id } }}
          asChild>
          <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
            <GroupAvatar group={item} size={40} />
            <View className="flex-1">
              <Text className="font-medium">{item.label}</Text>
              {index === 0 && isManager(group) && (
                <Text className="text-muted-foreground text-xs">Alle medlemmer får varsel</Text>
              )}
            </View>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </Pressable>
        </Link>
      )}
    />
  );
}
