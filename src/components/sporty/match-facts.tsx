import { Link } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useMatchFacts, useMatchStatMutations } from '@/data/hooks';
import type { Event, MatchStat } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Kampfakta på en kamp som har startet eller er ferdig: resultatet og hendelsene (mål, kort …).
 * Vises ikke når admin har skrudd av kampfakta for laget. Sub-/admin registrerer og fjerner.
 */
export function MatchFactsSection({ event }: { event: Event }) {
  const facts = useMatchFacts(event.id);
  if (!facts.data?.enabled) return null;
  const { types, stats, canEdit } = facts.data;
  const hasResult = event.ourScore !== null && event.theirScore !== null;
  if (!canEdit && !hasResult && stats.length === 0) return null;

  // Samme rekkefølge som typene i innstillingene, og ellers i den rekkefølgen de ble registrert.
  const order = new Map(types.map((type, index) => [type.id, index]));
  const sorted = [...stats].sort(
    (a, b) => (order.get(a.type.id) ?? 0) - (order.get(b.type.id) ?? 0)
  );

  return (
    <View className="gap-3">
      <Text variant="h4">Kampfakta</Text>
      <MatchResult event={event} />
      <View className="bg-muted/60 rounded-2xl px-4">
        <Text className="text-muted-foreground pt-3 text-sm">Hendelser</Text>
        {sorted.length === 0 ? (
          <Text className="text-muted-foreground py-3">Ingen hendelser er registrert</Text>
        ) : (
          sorted.map((stat, index) => (
            <View key={stat.id}>
              {index > 0 && <Separator />}
              <StatRow eventId={event.id} stat={stat} canEdit={canEdit} />
            </View>
          ))
        )}
      </View>
      {canEdit && (
        <Link href={{ pathname: '/ny-hendelse', params: { eventId: event.id } }} asChild>
          <Button variant="outline" className="rounded-full">
            <Icon as={Plus} size={16} />
            <Text>Legg til hendelse</Text>
          </Button>
        </Link>
      )}
    </View>
  );
}

function StatRow({
  eventId,
  stat,
  canEdit,
}: {
  eventId: string;
  stat: MatchStat;
  canEdit: boolean;
}) {
  const { remove } = useMatchStatMutations(eventId);
  const confirmRemove = () =>
    Alert.alert(`Fjerne ${stat.type.name.toLowerCase()} for ${stat.user.name}?`, undefined, [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Fjern',
        style: 'destructive',
        onPress: () =>
          remove.mutate(stat.id, {
            onError: (error) => Alert.alert('Kunne ikke fjerne hendelsen', error.message),
          }),
      },
    ]);

  return (
    <View className="flex-row items-center gap-3 py-3">
      <Text className="w-28 font-medium">{stat.type.name}</Text>
      <Text className="flex-1">{stat.user.name}</Text>
      {canEdit && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fjern ${stat.type.name} for ${stat.user.name}`}
          hitSlop={8}
          disabled={remove.isPending}
          onPress={confirmRemove}
          className="active:opacity-60">
          <Icon as={Trash2} size={18} className="text-destructive" />
        </Pressable>
      )}
    </View>
  );
}

/** Resultatet på kampen. Sub-/admin kan registrere eller endre det. */
function MatchResult({ event }: { event: Event }) {
  const hasResult = event.ourScore !== null && event.theirScore !== null;
  const outcome = !hasResult
    ? null
    : event.ourScore! > event.theirScore!
      ? { label: 'Seier', className: 'text-green-500' }
      : event.ourScore! < event.theirScore!
        ? { label: 'Tap', className: 'text-red-500' }
        : { label: 'Uavgjort', className: 'text-muted-foreground' };

  if (!hasResult && !event.canManage) return null;

  const content = (
    <View className="bg-muted/60 flex-row items-center gap-4 rounded-2xl p-4">
      <View className="flex-1 gap-0.5">
        <Text className="text-muted-foreground text-sm">Resultat</Text>
        {hasResult ? (
          <View className="flex-row items-baseline gap-3">
            <Text className="text-3xl font-bold">
              {event.ourScore} – {event.theirScore}
            </Text>
            <Text className={cn('font-semibold', outcome!.className)}>{outcome!.label}</Text>
          </View>
        ) : (
          <Text className="font-medium">Ikke registrert</Text>
        )}
      </View>
      {event.canManage && (
        <Text className="text-brand font-medium">{hasResult ? 'Endre' : 'Registrer'}</Text>
      )}
    </View>
  );

  if (!event.canManage) return content;
  return (
    <Link href={{ pathname: '/resultat', params: { eventId: event.id } }} asChild>
      <Pressable className="active:opacity-70">{content}</Pressable>
    </Link>
  );
}
