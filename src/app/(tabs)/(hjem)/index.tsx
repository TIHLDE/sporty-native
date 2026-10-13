import { Link } from 'expo-router';
import { CircleDollarSign } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AnnouncementCard } from '@/components/sporty/announcement-card';
import { EmptyState } from '@/components/sporty/empty-state';
import { EventList } from '@/components/sporty/event-list';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAnnouncements, useManagedGroups, useUpcomingEvents } from '@/data/hooks';

export default function HjemScreen() {
  const events = useUpcomingEvents();
  const announcements = useAnnouncements();
  const managedGroups = useManagedGroups();
  const canGiveFines = (managedGroups.data?.length ?? 0) > 0;

  const refresh = () => Promise.all([events.refetch(), announcements.refetch(), managedGroups.refetch()]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-8 p-4 pb-12"
      refreshControl={<RefreshControl refreshing={events.isRefetching} onRefresh={refresh} />}>
      {canGiveFines && (
        <Link href="/gi-bot" asChild>
          <Button size="lg" className="bg-brand active:bg-brand/80 rounded-2xl">
            <Icon as={CircleDollarSign} size={18} className="text-white" />
            <Text className="text-white">Gi bot</Text>
          </Button>
        </Link>
      )}

      <View className="gap-3">
        <Text variant="h4">Kommende arrangementer</Text>
        <QueryState query={events}>
          {(data) => <EventList events={data} emptyText="Ingen kommende arrangementer" />}
        </QueryState>
      </View>

      <View className="gap-3">
        <Text variant="h4">Kunngjøringer</Text>
        <QueryState query={announcements}>
          {(data) =>
            data.length === 0 ? (
              <EmptyState text="Ingen kunngjøringer" />
            ) : (
              data.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} showGroup />
              ))
            )
          }
        </QueryState>
      </View>
    </ScrollView>
  );
}
