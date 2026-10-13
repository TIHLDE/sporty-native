import { useLocalSearchParams } from 'expo-router';
import { FlatList } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupTile } from '@/components/sporty/group-tile';
import { QueryState } from '@/components/sporty/query-state';
import { useGroup } from '@/data/hooks';

export default function UndergrupperScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);

  return (
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
          ListEmptyComponent={<EmptyState text="Ingen undergrupper" />}
        />
      )}
    </QueryState>
  );
}
