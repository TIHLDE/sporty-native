import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useEvent, useSetResult } from '@/data/hooks';

const parseScore = (text: string) => (/^\d{1,2}$/.test(text) ? Number(text) : null);

/** (Sub-/admin) Registrer eller endre resultatet på en kamp. */
export default function ResultatScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const event = useEvent(eventId).data;
  const setResult = useSetResult(eventId);
  const [ours, setOurs] = useState(event?.ourScore?.toString() ?? '');
  const [theirs, setTheirs] = useState(event?.theirScore?.toString() ?? '');

  const ourScore = parseScore(ours);
  const theirScore = parseScore(theirs);
  const valid = ourScore !== null && theirScore !== null;

  const save = (score: { ourScore: number | null; theirScore: number | null }) =>
    setResult.mutate(score, {
      onSuccess: () => router.back(),
      onError: (error) => Alert.alert('Kunne ikke lagre resultatet', error.message),
    });

  return (
    <View className="gap-5 px-4 pb-8 pt-6">
      <View>
        <Text variant="h4">Resultat</Text>
        {event && (
          <Text className="text-muted-foreground text-sm">
            {event.groupName}
            {event.opponent ? ` mot ${event.opponent}` : ''}
          </Text>
        )}
      </View>

      <View className="flex-row items-end gap-3">
        <ScoreField label={event?.groupName ?? 'Oss'} value={ours} onChange={setOurs} />
        <Text className="pb-3 text-2xl font-bold">–</Text>
        <ScoreField label={event?.opponent ?? 'Motstander'} value={theirs} onChange={setTheirs} />
      </View>

      <Button
        size="lg"
        className="bg-brand active:bg-brand/80 rounded-full"
        disabled={!valid || setResult.isPending}
        onPress={() => save({ ourScore, theirScore })}>
        <Text className="text-white">Lagre resultat</Text>
      </Button>
      {event?.ourScore !== null && event?.ourScore !== undefined && (
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={setResult.isPending}
          onPress={() => save({ ourScore: null, theirScore: null })}>
          <Text className="text-destructive">Fjern resultat</Text>
        </Button>
      )}
    </View>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-1 gap-2">
      <Text className="text-muted-foreground text-center text-sm" numberOfLines={1}>
        {label}
      </Text>
      <Input
        className="h-14 text-center text-2xl font-bold"
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        placeholder="0"
      />
    </View>
  );
}
