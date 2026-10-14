import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupTile } from '@/components/sporty/group-tile';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';

/** Undergruppene, f.eks. 11'er og 7'er. Admin i hovedgruppen kan lage nye. */
export default function UndergrupperScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  const canCreate = Boolean(group.data?.canAdmin && !group.data.parentId);
  const newHref = `/grupper/${groupId}/ny-undergruppe` as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: canCreate
            ? () => (
                <Link href={newHref} asChild>
                  <Pressable hitSlop={8} accessibilityLabel="Ny undergruppe">
                    <Icon as={Plus} size={24} />
                  </Pressable>
                </Link>
              )
            : undefined,
        }}
      />
      <QueryState query={group}>
        {({ subgroups }) => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="gap-4 p-4 pb-12"
            columnWrapperClassName="gap-4"
            numColumns={2}
            data={subgroups}
            keyExtractor={(g) => g.id}
            renderItem={({ item }) => <GroupTile group={item} />}
            ListEmptyComponent={
              <View className="items-center gap-4">
                <EmptyState text="Ingen undergrupper" />
                {canCreate && (
                  <Link href={newHref} asChild>
                    <Button className="bg-brand active:bg-brand/80 rounded-full">
                      <Text className="text-white">Lag undergruppe</Text>
                    </Button>
                  </Link>
                )}
              </View>
            }
          />
        )}
      </QueryState>
    </>
  );
}
