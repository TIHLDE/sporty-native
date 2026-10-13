import { Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { NotificationRow } from '@/components/sporty/notification-row';
import { QueryState } from '@/components/sporty/query-state';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useMarkAllNotificationsRead, useNotifications } from '@/data/hooks';

export default function VarslerScreen() {
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const hasUnread = notifications.data?.some((n) => !n.read);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            hasUnread ? (
              <Pressable onPress={() => markAllRead.mutate()} hitSlop={8} className="px-1">
                <Text className="text-brand font-medium">Merk alle som lest</Text>
              </Pressable>
            ) : null,
        }}
      />
      <QueryState query={notifications}>
        {(data) => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="px-4 pb-12"
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NotificationRow notification={item} />}
            ItemSeparatorComponent={() => <Separator />}
            ListEmptyComponent={<EmptyState text="Ingen varsler ennå" />}
            refreshControl={
              <RefreshControl refreshing={notifications.isRefetching} onRefresh={notifications.refetch} />
            }
          />
        )}
      </QueryState>
    </>
  );
}
