import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { Event } from '@/data/types';
import { getIsoWeek } from '@/lib/dates';

import { EmptyState } from './empty-state';
import { EventCard } from './event-card';

/** Arrangementer gruppert under "Uke 46"-overskrifter, som i Spond. */
export function EventList({ events, emptyText }: { events: Event[]; emptyText: string }) {
  if (events.length === 0) return <EmptyState text={emptyText} />;

  const weeks: { week: number; events: Event[] }[] = [];
  for (const event of events) {
    const week = getIsoWeek(event.start);
    const last = weeks[weeks.length - 1];
    if (last?.week === week) last.events.push(event);
    else weeks.push({ week, events: [event] });
  }

  return (
    <View className="gap-4">
      {weeks.map(({ week, events: weekEvents }) => (
        <View key={week} className="gap-2">
          <Text className="text-muted-foreground text-sm font-medium">Uke {week}</Text>
          {weekEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      ))}
    </View>
  );
}
