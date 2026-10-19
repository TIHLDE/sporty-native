import { Link, useSegments } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useSession } from '@/data/session';
import type { Event } from '@/data/types';
import { summarizeAttendance } from '@/lib/attendance';
import { formatDayOfMonth, formatEventStart, formatMonthShort } from '@/lib/dates';
import { EVENT_TYPE_LABEL } from '@/lib/events';

import { AttendanceCounts } from './attendance-counts';

/** Arrangementskort i Spond-stil: datoblokk til venstre, detaljer og oppmøte til høyre. */
export function EventCard({ event }: { event: Event }) {
  const { userId } = useSession();
  const { myStatus, kommer, ubesvart, kommerIkke } = summarizeAttendance(event, userId);
  const isMember = event.memberIds.includes(userId);
  const canAnswer = !event.signupDeadline || new Date(event.signupDeadline) > new Date();
  // Åpne arrangementet i fanen man står i, så det skyves inn der i stedet for å bytte fane.
  const inHomeTab = (useSegments() as string[]).includes('(hjem)');
  const href = inHomeTab
    ? (`/arrangement/${event.id}` as const)
    : (`/grupper/${event.groupId}/arrangement/${event.id}` as const);

  return (
    <Link href={href} asChild>
      <Pressable className="bg-muted/60 flex-row items-center gap-4 rounded-2xl px-4 py-3 active:opacity-70">
        <View className="w-12 items-center">
          <Text className="text-muted-foreground text-xs font-medium">
            {formatMonthShort(event.start)}
          </Text>
          <Text className="text-2xl font-semibold">{formatDayOfMonth(event.start)}</Text>
        </View>

        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-semibold" numberOfLines={1}>
              {event.title}
            </Text>
            {isMember && canAnswer && myStatus === 'ubesvart' && (
              <Badge className="bg-brand border-transparent">
                <Text className="text-white">Svar</Text>
              </Badge>
            )}
          </View>
          {event.opponent && (
            <Text className="text-sm font-medium" numberOfLines={1}>
              mot {event.opponent}
            </Text>
          )}
          <Text className="text-sm">{formatEventStart(event.start)}</Text>
          <Text className="text-muted-foreground text-sm">
            {EVENT_TYPE_LABEL[event.type]} · {event.groupName}
          </Text>
          <View className="mt-1">
            <AttendanceCounts
              kommer={kommer.length}
              ubesvart={ubesvart.length}
              kommerIkke={kommerIkke.length}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
