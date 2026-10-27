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
import { CollectiveFineButton, canGiveCollectiveFine } from './collective-fine-button';
import { GroupAvatar } from './group-avatar';

/**
 * Arrangementskort i Spond-stil: datoblokk til venstre, detaljer og oppmøte til høyre. Stripen i
 * gruppefargen og gruppen øverst viser hvilken gruppe det gjelder. Sub-/admin får «Gi fellesbot»
 * nederst når det kan gis, så de slipper å åpne arrangementet.
 */
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

  const showFineButton = canGiveCollectiveFine(event, ubesvart.length);
  // Eldre backend sender ikke gruppefargen. Da vises bare navnet, uten stripe og tom logo.
  const groupColor: string | undefined = event.groupColor || undefined;

  return (
    <View className="bg-muted/60 overflow-hidden rounded-2xl">
      {groupColor && (
        <View
          className="absolute bottom-0 left-0 top-0 w-1.5"
          style={{ backgroundColor: groupColor }}
        />
      )}
      <Link href={href} asChild>
        <Pressable className="flex-row items-center gap-4 px-4 py-3 active:opacity-70">
          <View className="w-12 items-center">
            <Text className="text-muted-foreground text-xs font-medium">
              {formatMonthShort(event.start)}
            </Text>
            <Text className="text-2xl font-semibold">{formatDayOfMonth(event.start)}</Text>
          </View>

          <View className="flex-1 gap-0.5">
            <View className="mb-0.5 flex-row items-center gap-1.5">
              {groupColor && (
                <GroupAvatar group={{ color: groupColor, logoUrl: event.groupLogoUrl }} size={18} />
              )}
              <Text className="flex-1 text-xs font-semibold italic" numberOfLines={1}>
                {event.groupName}
              </Text>
            </View>
            <Text className="font-semibold" numberOfLines={1}>
              {event.title}
            </Text>
            {event.opponent && (
              <Text className="text-sm font-medium" numberOfLines={1}>
                mot {event.opponent}
              </Text>
            )}
            <Text className="text-sm">{formatEventStart(event.start)}</Text>
            <Text className="text-muted-foreground text-sm">{EVENT_TYPE_LABEL[event.type]}</Text>
            <View className="mt-1">
              <AttendanceCounts
                kommer={kommer.length}
                ubesvart={ubesvart.length}
                kommerIkke={kommerIkke.length}
              />
            </View>
          </View>
          {/* Midt på høyden av kortet, på linje med datoen. */}
          {isMember && canAnswer && myStatus === 'ubesvart' && (
            <Badge className="bg-brand border-transparent">
              <Text className="text-white">Svar</Text>
            </Badge>
          )}
        </Pressable>
      </Link>
      {/* Utenfor lenken, så trykket ikke også åpner arrangementet. */}
      {showFineButton && (
        <View className="px-4 pb-3">
          <CollectiveFineButton eventId={event.id} count={ubesvart.length} />
        </View>
      )}
    </View>
  );
}
