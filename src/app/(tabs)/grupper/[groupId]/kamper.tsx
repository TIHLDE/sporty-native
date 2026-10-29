import { Link, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import { EmptyState } from "@/components/sporty/empty-state";
import { ResultBadge } from "@/components/sporty/stats-tab";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useGroupStats } from "@/data/hooks";
import type { StatsOpponent } from "@/data/types";
import { formatDateLong } from "@/lib/dates";

/**
 * Kampene i statistikkens periode: resultatene mot hver motstander, og alle kampene (nyeste først).
 * Trykk på en kamp for å åpne den.
 */
export default function KamperScreen() {
  const { groupId, period } = useLocalSearchParams<{
    groupId: string;
    period?: string;
  }>();
  const stats = useGroupStats(groupId, period ?? null).data;

  if (!stats) return <ActivityIndicator className="py-10" />;
  const { matches } = stats.team;
  if (matches.games.length === 0) {
    return (
      <EmptyState text={`Ingen kamper med resultat i ${stats.period.label}`} />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16"
    >
      <View className="gap-1">
        <Text className="text-muted-foreground text-sm">
          {stats.period.label}
        </Text>
        <Text className="text-3xl font-extrabold">
          {matches.wins}-{matches.draws}-{matches.losses}
        </Text>
        <Text className="text-muted-foreground text-sm">
          Seier, uavgjort, tap · mål {matches.goalsFor}-{matches.goalsAgainst}
        </Text>
      </View>

      <Section title="Mot motstander">
        {matches.opponents.map((o, index) => (
          <View key={o.name}>
            {index > 0 && <Separator />}
            <OpponentRow opponent={o} />
          </View>
        ))}
      </Section>

      <Section title="Alle kamper">
        {matches.games.map((game, index) => (
          <View key={game.eventId}>
            {index > 0 && <Separator />}
            <Link
              href={`/grupper/${groupId}/arrangement/${game.eventId}`}
              asChild
            >
              <Pressable
                accessibilityLabel={`${game.opponent ?? game.title}, ${game.ourScore}-${game.theirScore}`}
                className="flex-row items-center gap-3 px-4 py-3 active:opacity-70"
              >
                <ResultBadge result={game.result} />
                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={1}>
                    {game.opponent ? `mot ${game.opponent}` : game.title}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {formatDateLong(game.start)}
                  </Text>
                </View>
                <Text className="text-lg font-bold tabular-nums">
                  {game.ourScore}-{game.theirScore}
                </Text>
                <Icon
                  as={ChevronRight}
                  size={16}
                  className="text-muted-foreground"
                />
              </Pressable>
            </Link>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function OpponentRow({ opponent: o }: { opponent: StatsOpponent }) {
  const played = o.wins + o.draws + o.losses;
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="flex-1">
        <Text className="font-medium" numberOfLines={1}>
          {o.name}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {played} {played === 1 ? "kamp" : "kamper"} · mål {o.goalsFor}-
          {o.goalsAgainst}
        </Text>
      </View>
      <Text className="text-sm font-semibold tabular-nums">
        {o.wins}-{o.draws}-{o.losses}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-muted-foreground px-1 text-xs font-medium uppercase">
        {title}
      </Text>
      <View className="bg-muted/60 overflow-hidden rounded-2xl">
        {children}
      </View>
    </View>
  );
}
