import { useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import {
  PersonRow,
  STATS_LISTS,
  statsValue,
  withRanks,
  type StatsList,
} from '@/components/sporty/stats-tab';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroupStats } from '@/data/hooks';

/**
 * Hele listen bak et kort på «Laget» i statistikken: alle som har scoret, eller alle medlemmene
 * etter antall treninger. Like verdier deler plass.
 */
export default function StatistikkListeScreen() {
  const { groupId, period, list } = useLocalSearchParams<{
    groupId: string;
    period: string;
    list: StatsList;
  }>();
  const stats = useGroupStats(groupId, period ?? null).data;
  const [query, setQuery] = useState('');
  const { title } = STATS_LISTS[list] ?? STATS_LISTS.scorers;

  if (!stats) return <ActivityIndicator className="py-10" />;
  const people = list === 'trainings' ? stats.team.trainings : stats.team.scorers;
  const q = query.trim().toLowerCase();
  const rows = withRanks(people).filter(({ person }) => person.user.name.toLowerCase().includes(q));

  return (
    <FlatList
      contentContainerClassName="px-4 pb-10 pt-6"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      data={rows}
      keyExtractor={({ person }) => person.user.id}
      ListHeaderComponent={
        <View className="gap-3 pb-2">
          <View>
            <Text variant="h4">{title}</Text>
            <Text className="text-muted-foreground text-sm">
              {stats.period.label} · {people.length} personer
            </Text>
          </View>
          <View className="justify-center">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Søk etter navn"
              autoCorrect={false}
              className="rounded-full pl-9"
            />
            <View className="absolute left-3 h-10 justify-center" pointerEvents="none">
              <Icon as={Search} size={16} className="text-muted-foreground" />
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={<EmptyState text="Ingen treff" />}
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item: { person, rank } }) => (
        <View className="py-2.5">
          <PersonRow person={person} rank={rank} text={statsValue(list, person)} />
        </View>
      )}
    />
  );
}
