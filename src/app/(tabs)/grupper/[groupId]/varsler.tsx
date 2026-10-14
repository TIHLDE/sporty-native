import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { NotificationRow } from '@/components/sporty/notification-row';
import { QueryState } from '@/components/sporty/query-state';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/data/hooks';

export default function GruppeVarslerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const notifications = useNotifications(groupId);

  return (
    <QueryState query={notifications}>
      {(data) => (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-4 pb-12"
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationRow notification={item} />}
          ItemSeparatorComponent={() => <Separator />}
          // Leste varsler blir liggende. Eldre hentes når man ruller til bunnen.
          onEndReached={() => notifications.hasNextPage && notifications.fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            notifications.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
          ListEmptyComponent={<EmptyState text="Ingen varsler fra gruppen" />}
        />
      )}
    </QueryState>
  );
}
