import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  Check,
  Gavel,
  Hourglass,
  MapPin,
  Pencil,
  Swords,
  Tag,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { EventMap } from '@/components/sporty/event-map';
import { MatchFactsSection } from '@/components/sporty/match-facts';
import {
  ChoosePositionPrompt,
  ParticipantsByPosition,
  eventPositions,
} from '@/components/sporty/positions';
import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useCollectiveFine, useEvent, useGroup, useSetAttendance } from '@/data/hooks';
import { useSession } from '@/data/session';
import type { Event, Member } from '@/data/types';
import { summarizeAttendance } from '@/lib/attendance';
import { formatEventRange, formatEventStart } from '@/lib/dates';
import { EVENT_TYPE_LABEL, locationLabel } from '@/lib/events';
import { formatFineCount } from '@/lib/fines';
import { cn } from '@/lib/utils';

const COLLECTIVE_FINE_COUNT = 1;

/** Arrangementssiden. Brukes av både Hjem- og Grupper-fanen, så den skyves inn i fanen man står i. */
export function EventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const event = useEvent(eventId);
  return <QueryState query={event}>{(data) => <EventDetails event={data} />}</QueryState>;
}

function EventDetails({ event }: { event: Event }) {
  const { userId } = useSession();
  const group = useGroup(event.groupId);
  const setAttendance = useSetAttendance(event.id);
  const [tab, setTab] = useState('kommer');
  const now = new Date();
  const isPast = new Date(event.end ?? event.start) < now;
  const deadlinePassed = event.signupDeadline !== null && new Date(event.signupDeadline) < now;
  // Fellesbot kan først gis når man ikke lenger kan svare: etter fristen, eller når
  // arrangementet har startet hvis det ikke har noen frist.
  const answeringClosed = event.signupDeadline ? deadlinePassed : new Date(event.start) <= now;
  const isMember = event.memberIds.includes(userId);
  const notStarted = new Date(event.start) > now;
  // Fullt: ingen nye kan si «Kommer», men de som allerede kommer beholder plassen.
  const comingCount = Object.values(event.attendance).filter((s) => s === 'kommer').length;
  const full =
    event.maxAttendees !== null &&
    comingCount >= event.maxAttendees &&
    event.attendance[userId] !== 'kommer';

  // Vis svaret med en gang mens forespørselen pågår.
  const shownEvent: Event =
    setAttendance.isPending && setAttendance.variables
      ? { ...event, attendance: { ...event.attendance, [userId]: setAttendance.variables.status } }
      : event;
  const { myStatus, kommer, kommerIkke, ubesvart } = summarizeAttendance(shownEvent, userId);
  const members = new Map((group.data?.members ?? []).map((m) => [m.user.id, m]));
  // Posisjonene i gruppen på kamper og treninger. Da deles «Kommer» inn etter posisjon.
  const positions = eventPositions(event, group.data);
  const missingMyPosition = isMember && positions.length > 0 && !members.get(userId)?.position;

  const comeAnyway = () =>
    setAttendance.mutate(
      { status: 'kommer' },
      { onError: (error) => Alert.alert('Kunne ikke lagre svaret', error.message) }
    );
  // «Kommer ikke» krever begrunnelse, så den skrives i et eget ark (også for å endre den).
  const sendRegrets = () => router.push({ pathname: '/avbud', params: { eventId: event.id } });
  const myReason = event.absenceReasons[userId];

  return (
    <>
      <Stack.Screen
        options={{
          title: event.title,
          headerRight: () =>
            event.canManage && !isPast ? (
              <Link
                href={{
                  pathname: '/nytt-arrangement/detaljer',
                  params: { eventId: event.id, forGroupId: event.groupId },
                }}
                asChild>
                <Pressable hitSlop={8} className="px-1" accessibilityLabel="Rediger arrangement">
                  <Icon as={Pencil} size={20} />
                </Pressable>
              </Link>
            ) : null,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 p-4 pb-32">
        <View className="gap-3">
          <Text className="text-muted-foreground text-sm">{event.groupName}</Text>
          <Text variant="h3">{event.title}</Text>
          <InfoLine icon={Tag} text={EVENT_TYPE_LABEL[event.type]} />
          {event.opponent && <InfoLine icon={Swords} text={`Mot ${event.opponent}`} />}
          <InfoLine icon={CalendarDays} text={formatEventRange(event.start, event.end)} />
          <InfoLine icon={MapPin} text={locationLabel(event.location)} />
          {event.signupDeadline && (
            <InfoLine
              icon={Hourglass}
              text={`${deadlinePassed ? 'Påmeldingen stengte' : 'Påmeldingsfrist'} ${formatEventStart(event.signupDeadline)}`}
            />
          )}
          {event.description ? <Text className="leading-6">{event.description}</Text> : null}
        </View>

        {event.type === 'kamp' && !notStarted && <MatchFactsSection event={event} />}

        <EventMap location={event.location} />

        {!isPast && isMember && deadlinePassed && (
          <Text className="text-muted-foreground text-center text-sm">
            Påmeldingsfristen har gått ut. Ta kontakt med sub-/admin hvis du må endre svaret.
          </Text>
        )}
        {!isPast && isMember && !deadlinePassed && (
          <View className="flex-row gap-3">
            <Button
              disabled={full}
              className={cn(
                'flex-1 rounded-full',
                myStatus === 'kommer' && 'bg-green-600 active:bg-green-700'
              )}
              variant={myStatus === 'kommer' ? 'default' : 'outline'}
              onPress={comeAnyway}>
              <Icon
                as={Check}
                size={16}
                className={myStatus === 'kommer' ? 'text-white' : undefined}
              />
              <Text className={myStatus === 'kommer' ? 'text-white' : undefined}>
                {full ? 'Fullt' : 'Kommer'}
              </Text>
            </Button>
            <Button
              className={cn(
                'flex-1 rounded-full',
                myStatus === 'kommer_ikke' && 'bg-red-600 active:bg-red-700'
              )}
              variant={myStatus === 'kommer_ikke' ? 'default' : 'outline'}
              onPress={sendRegrets}>
              <Icon
                as={X}
                size={16}
                className={myStatus === 'kommer_ikke' ? 'text-white' : undefined}
              />
              <Text className={myStatus === 'kommer_ikke' ? 'text-white' : undefined}>
                Kommer ikke
              </Text>
            </Button>
          </View>
        )}
        {!isPast && isMember && myStatus === 'kommer_ikke' && myReason && (
          <Text className="text-muted-foreground -mt-2 text-center text-sm">
            Din begrunnelse: {myReason}
            {!deadlinePassed && ' · trykk «Kommer ikke» for å endre'}
          </Text>
        )}
        {!isPast && missingMyPosition && <ChoosePositionPrompt groupId={event.groupId} />}

        <View className="gap-3">
          <Text variant="h4">Deltakere</Text>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="kommer" className="flex-1">
                <Text>
                  Kommer ({kommer.length}
                  {event.maxAttendees !== null && `/${event.maxAttendees}`})
                </Text>
              </TabsTrigger>
              <TabsTrigger value="ubesvart" className="flex-1">
                <Text>Ikke svart ({ubesvart.length})</Text>
              </TabsTrigger>
              <TabsTrigger value="kommer_ikke" className="flex-1">
                <Text>Nei ({kommerIkke.length})</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="kommer">
              {positions.length > 0 ? (
                <ParticipantsByPosition
                  userIds={kommer}
                  members={members}
                  positions={positions}
                  empty="Ingen har meldt seg på ennå"
                />
              ) : (
                <ParticipantList
                  userIds={kommer}
                  members={members}
                  empty="Ingen har meldt seg på ennå"
                />
              )}
            </TabsContent>
            <TabsContent value="ubesvart">
              <ParticipantList userIds={ubesvart} members={members} empty="Alle har svart 🎉" />
            </TabsContent>
            <TabsContent value="kommer_ikke">
              <ParticipantList
                userIds={kommerIkke}
                members={members}
                reasons={event.absenceReasons}
                empty="Ingen har meldt avbud"
              />
            </TabsContent>
          </Tabs>
        </View>

        {event.canGiveFines &&
          answeringClosed &&
          ubesvart.length > 0 &&
          !event.collectiveFineGiven && (
            <CollectiveFineButton eventId={event.id} count={ubesvart.length} />
          )}
      </ScrollView>
    </>
  );
}

function InfoLine({ icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={icon} size={16} className="text-muted-foreground" />
      <Text className="flex-1">{text}</Text>
    </View>
  );
}

/** `reasons` brukes for «Kommer ikke»: begrunnelsen vises under navnet. */
function ParticipantList({
  userIds,
  members,
  reasons,
  empty,
}: {
  userIds: string[];
  members: Map<string, Member>;
  reasons?: Record<string, string>;
  empty: string;
}) {
  if (userIds.length === 0) return <EmptyState text={empty} />;

  return (
    <View>
      {userIds.map((id, index) => {
        const member = members.get(id);
        if (!member) return null;
        return (
          <View key={id}>
            {index > 0 && <Separator />}
            <UserRow user={member.user} subtitle={reasons?.[id] || undefined} />
          </View>
        );
      })}
    </View>
  );
}

/** (Sub-/admin) Fellesbot til alle som ikke har svart. */
function CollectiveFineButton({ eventId, count }: { eventId: string; count: number }) {
  const collectiveFine = useCollectiveFine(eventId);

  const give = () =>
    collectiveFine.mutate(undefined, {
      onSuccess: ({ count: given }) =>
        Alert.alert(
          'Fellesbot gitt',
          `${given} ${given === 1 ? 'medlem' : 'medlemmer'} fikk 1 bot.`
        ),
      onError: (error) => Alert.alert('Kunne ikke gi fellesbot', error.message),
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-destructive rounded-full">
          <Icon as={Gavel} size={16} className="text-destructive" />
          <Text className="text-destructive">Gi fellesbot ({count})</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gi fellesbot?</AlertDialogTitle>
          <AlertDialogDescription>
            {count} medlemmer som ikke har svart får {formatFineCount(COLLECTIVE_FINE_COUNT)} hver.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Avbryt</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={give}>
            <Text>Gi fellesbot</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
