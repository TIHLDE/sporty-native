import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { CircleDollarSign, FileImage, FileText, ListFilter, Plus, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { AnnouncementCard } from '@/components/sporty/announcement-card';
import { EmptyState } from '@/components/sporty/empty-state';
import { EventList } from '@/components/sporty/event-list';
import { FineRow } from '@/components/sporty/fine-row';
import { GroupBanner } from '@/components/sporty/group-banner';
import { PaymentCard } from '@/components/sporty/payment-card';
import { PollCard } from '@/components/sporty/poll-card';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import {
  useAnnouncements,
  useFiles,
  useGroup,
  useGroupEvents,
  useGroupFines,
  useGroupPayments,
  usePolls,
} from '@/data/hooks';
import type { GroupDetails } from '@/data/types';
import { formatRelative } from '@/lib/dates';
import { formatFineCount } from '@/lib/fines';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'arrangementer', label: 'Arrangementer' },
  { value: 'kunngjoringer', label: 'Kunngjøringer' },
  { value: 'avstemninger', label: 'Avstemninger' },
  { value: 'boter', label: 'Bøter' },
  { value: 'betalinger', label: 'Betalinger' },
  { value: 'filer', label: 'Filer' },
];

export default function GroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);

  return <QueryState query={group}>{(data) => <GroupView group={data} />}</QueryState>;
}

function GroupView({ group }: { group: GroupDetails }) {
  const [tab, setTab] = useState(TABS[0].value);
  // Bøter gjelder hele gruppen og hører til hovedgruppen, så undergrupper har ikke Bøter-fanen.
  const tabs = group.parentId ? TABS.filter((t) => t.value !== 'boter') : TABS;
  const [favorite, setFavorite] = useState(false);
  const manage = group.canManage;

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <View className="flex-row items-center gap-4 px-1">
              <Pressable onPress={() => setFavorite((value) => !value)} hitSlop={8}>
                <Icon
                  as={Star}
                  size={22}
                  className="text-white"
                  fill={favorite ? '#fff' : 'transparent'}
                />
              </Pressable>
              {manage && (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/opprett', params: { groupId: group.id } })
                  }
                  hitSlop={8}>
                  <Icon as={Plus} size={24} className="text-white" />
                </Pressable>
              )}
            </View>
          ),
        }}
      />
      <Tabs value={tab} onValueChange={setTab} className="flex-1 gap-0">
        <ScrollView
          stickyHeaderIndices={[1]}
          contentInsetAdjustmentBehavior="never"
          contentContainerClassName="pb-32">
          <GroupBanner group={group} />

          <View className="bg-background border-border border-b py-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4">
              <TabsList className="h-auto gap-1 bg-transparent p-0">
                {tabs.map(({ value, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      'h-9 rounded-full border-0 px-4',
                      tab === value && 'bg-muted dark:bg-muted'
                    )}>
                    <Text>{label}</Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>
          </View>

          <View className="p-4">
            <TabsContent value="arrangementer">
              <EventsTab groupId={group.id} />
            </TabsContent>
            <TabsContent value="kunngjoringer">
              <AnnouncementsTab groupId={group.id} />
            </TabsContent>
            <TabsContent value="avstemninger">
              <PollsTab groupId={group.id} />
            </TabsContent>
            {!group.parentId && (
              <TabsContent value="boter">
                <FinesTab group={group} />
              </TabsContent>
            )}
            <TabsContent value="betalinger">
              <PaymentsTab groupId={group.id} manage={manage} />
            </TabsContent>
            <TabsContent value="filer">
              <FilesTab groupId={group.id} />
            </TabsContent>
          </View>
        </ScrollView>
      </Tabs>
    </>
  );
}

function EventsTab({ groupId }: { groupId: string }) {
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const events = useGroupEvents(groupId, when);

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => setWhen((value) => (value === 'upcoming' ? 'past' : 'upcoming'))}
        className="flex-row items-center gap-1.5 self-end active:opacity-70">
        <Text className="text-sm">{when === 'upcoming' ? 'Kommende' : 'Tidligere'}</Text>
        <Icon as={ListFilter} size={16} />
      </Pressable>
      <QueryState query={events}>
        {(data) => (
          <EventList
            events={data}
            emptyText={
              when === 'upcoming' ? 'Ingen kommende arrangementer' : 'Ingen tidligere arrangementer'
            }
          />
        )}
      </QueryState>
    </View>
  );
}

function AnnouncementsTab({ groupId }: { groupId: string }) {
  const announcements = useAnnouncements(groupId);

  return (
    <QueryState query={announcements}>
      {(data) =>
        data.length === 0 ? (
          <EmptyState text="Ingen kunngjøringer" />
        ) : (
          <View className="gap-3">
            {data.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </View>
        )
      }
    </QueryState>
  );
}

function PollsTab({ groupId }: { groupId: string }) {
  const polls = usePolls(groupId);

  return (
    <QueryState query={polls}>
      {(data) =>
        data.length === 0 ? (
          <EmptyState text="Ingen avstemninger" />
        ) : (
          <View className="gap-3">
            {data.map((poll) => (
              <PollCard key={poll.id} poll={poll} linkToDetails />
            ))}
          </View>
        )
      }
    </QueryState>
  );
}

/**
 * Bøtene i gruppen, 25 om gangen med «Last inn flere» nederst. For lag fra tihlde.org hentes de
 * derfra: alle medlemmer ser alle, og alle kan gi bot. Trykk på en bot for detaljer, bilde og
 * (for botsjef og leder) godkjenning.
 */
function FinesTab({ group }: { group: GroupDetails }) {
  const fines = useGroupFines(group.id);
  const { source, activated, canGive, canSettle } = group.fines;
  const fromTihlde = source === 'tihlde';

  if (fromTihlde && !activated) {
    return <EmptyState text="Bøter er ikke slått på for laget på tihlde.org" />;
  }

  return (
    <QueryState query={fines}>
      {(data) => {
        const all = data.pages.flatMap((page) => page.fines);
        const unpaid = data.pages[0]?.unpaidCount ?? 0;
        const label = fromTihlde
          ? 'Ubetalt i laget'
          : group.canManage
            ? 'Ubetalt i gruppen'
            : 'Dine ubetalte bøter';
        return (
          <View className="gap-4">
            <View className="bg-muted/60 flex-row items-center justify-between rounded-2xl p-4">
              <View>
                <Text className="text-muted-foreground text-sm">{label}</Text>
                <Text variant="h3">{formatFineCount(unpaid)}</Text>
              </View>
              {canGive && (
                <Link href={{ pathname: '/gi-bot/lov', params: { groupId: group.id } }} asChild>
                  <Button className="bg-brand active:bg-brand/80 rounded-full">
                    <Icon as={CircleDollarSign} size={16} className="text-white" />
                    <Text className="text-white">Gi bot</Text>
                  </Button>
                </Link>
              )}
            </View>

            {fromTihlde && (
              <Text className="text-muted-foreground text-xs">
                Bøtene hentes fra tihlde.org. Nye bøter venter på godkjenning fra botsjefen
                {canSettle ? ', som du kan gjøre ved å trykke på en bot.' : '.'}
              </Text>
            )}

            {all.length === 0 ? (
              <EmptyState text="Ingen bøter 🎉" />
            ) : (
              <View>
                {all.map((fine, index) => (
                  <View key={fine.id}>
                    {index > 0 && <Separator />}
                    <Link href={`/grupper/${group.id}/bot/${fine.id}`} asChild>
                      <Pressable className="active:opacity-70">
                        <FineRow fine={fine} />
                      </Pressable>
                    </Link>
                  </View>
                ))}
              </View>
            )}

            {fines.hasNextPage && (
              <Button
                variant="outline"
                className="rounded-full"
                disabled={fines.isFetchingNextPage}
                onPress={() => fines.fetchNextPage()}>
                <Text>{fines.isFetchingNextPage ? 'Laster…' : 'Last inn flere'}</Text>
              </Button>
            )}
          </View>
        );
      }}
    </QueryState>
  );
}

function PaymentsTab({ groupId, manage }: { groupId: string; manage: boolean }) {
  const payments = useGroupPayments(groupId);

  return (
    <View className="gap-3">
      <Text className="text-muted-foreground text-sm">
        Betaling skjer i Vipps, ikke i appen. Marker selv når du har betalt.
      </Text>
      {manage && (
        <Link href={{ pathname: '/ny-betaling', params: { groupId } }} asChild>
          <Button variant="outline" className="rounded-full">
            <Icon as={Plus} size={16} />
            <Text>Ny betaling</Text>
          </Button>
        </Link>
      )}
      <QueryState query={payments}>
        {(data) =>
          data.length === 0 ? (
            <EmptyState text="Ingen betalinger" />
          ) : (
            data.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
          )
        }
      </QueryState>
    </View>
  );
}

function FilesTab({ groupId }: { groupId: string }) {
  const files = useFiles(groupId);

  return (
    <QueryState query={files}>
      {(data) =>
        data.length === 0 ? (
          <EmptyState text="Ingen filer" />
        ) : (
          <View>
            {data.map((file, index) => (
              <View key={file.id}>
                {index > 0 && <Separator />}
                <Pressable
                  onPress={() => Alert.alert(file.name, 'Åpning av filer kommer senere.')}
                  className="flex-row items-center gap-3 py-3 active:opacity-70">
                  <View className="bg-muted size-10 items-center justify-center rounded-lg">
                    <Icon as={file.kind === 'image' ? FileImage : FileText} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium">{file.name}</Text>
                    <Text className="text-muted-foreground text-xs">
                      {file.sizeKb >= 1000
                        ? `${(file.sizeKb / 1000).toFixed(1)} MB`
                        : `${file.sizeKb} kB`}{' '}
                      · {formatRelative(file.uploadedAt)}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )
      }
    </QueryState>
  );
}
