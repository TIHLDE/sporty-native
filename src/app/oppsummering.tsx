import { router, useLocalSearchParams } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/sporty/empty-state';
import { percent, WEEKDAYS } from '@/components/sporty/stats-tab';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useGroup, useGroupStats, useMe } from '@/data/hooks';

/**
 * Semester-oppsummering («Wrapped») for brukeren i en gruppe: oppmøte, plass på laget, mål og
 * favorittdag, i gruppens farge. Kan deles som tekst.
 */
export default function OppsummeringScreen() {
  const { groupId, period } = useLocalSearchParams<{ groupId: string; period: string }>();
  const stats = useGroupStats(groupId, period ?? null).data;
  const group = useGroup(groupId).data;
  const meUser = useMe().data;
  const insets = useSafeAreaInsets();
  const me = stats?.me;

  if (!stats || !group) return <ActivityIndicator className="flex-1" />;
  if (!me) return <EmptyState text="Du er ikke medlem av gruppen" />;

  const favorite = me.favoriteWeekday;
  const lines = [
    `${stats.period.label} i ${group.name}:`,
    `${me.attendance.count} av ${me.attendance.total} arrangementer (${percent(
      me.attendance.total ? me.attendance.count / me.attendance.total : null
    )})`,
    me.rank ? `Nr. ${me.rank} i oppmøte på laget` : null,
    me.matches.total ? `${me.matches.count} kamper` : null,
    me.goals ? `${me.goals} mål` : null,
  ].filter(Boolean);

  return (
    <View className="flex-1" style={{ backgroundColor: group.color }}>
      <ScrollView
        contentContainerClassName="gap-5 px-6"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-widest text-white/80">
            {stats.period.label}
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Lukk"
            hitSlop={8}
            className="size-10 items-center justify-center rounded-full bg-white/15 active:opacity-70">
            <Icon as={X} size={18} className="text-white" />
          </Pressable>
        </View>

        <View className="gap-1">
          <Text className="text-4xl font-black leading-tight text-white">
            Din sesong i {group.name}
          </Text>
          {meUser && <Text className="text-white/80">{meUser.name}</Text>}
        </View>

        <View className="gap-3.5 rounded-3xl bg-white/10 p-5">
          <Text className="text-6xl font-black text-white">{me.attendance.count}</Text>
          <Text className="font-semibold text-white">av {me.attendance.total} arrangementer</Text>
          {me.rank && (
            <Text className="text-sm text-white/80">Nr. {me.rank} i oppmøte på laget</Text>
          )}
        </View>

        <View className="flex-row gap-3.5">
          <View className="flex-1 rounded-3xl bg-white/10 p-4">
            <Text className="text-4xl font-black text-white">{me.goals}</Text>
            <Text className="font-semibold text-white">mål</Text>
          </View>
          <View className="flex-1 rounded-3xl bg-white/10 p-4">
            <Text className="text-4xl font-black text-white">{me.matches.count}</Text>
            <Text className="font-semibold text-white">kamper</Text>
          </View>
        </View>

        {favorite && (
          <View className="flex-row items-center gap-3.5 rounded-3xl bg-white/10 p-4">
            <Text className="text-3xl font-black capitalize text-white">
              {WEEKDAYS[favorite.weekday].slice(0, 3)}
            </Text>
            <View className="flex-1">
              <Text className="font-semibold text-white">Favorittdagen din</Text>
              <Text className="text-sm text-white/80">
                {favorite.count} av {favorite.total} arrangementer på {WEEKDAYS[favorite.weekday]}er
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => Share.share({ message: lines.join('\n') })}
          className="mt-2 flex-row items-center justify-center gap-2 rounded-full bg-white py-3.5 active:opacity-80">
          <Icon as={Share2} size={18} className="text-black" />
          <Text className="font-bold text-black">Del</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
