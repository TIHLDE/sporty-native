import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useEvent, useSetAttendance } from '@/data/hooks';
import { useSession } from '@/data/session';

/** Svar «Kommer ikke». Begrunnelsen er påkrevd og vises for alle på arrangementet. */
export default function AvbudScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { userId } = useSession();
  const event = useEvent(eventId).data;
  const setAttendance = useSetAttendance(eventId);
  const [reason, setReason] = useState(event?.absenceReasons[userId] ?? '');

  const save = () =>
    setAttendance.mutate(
      { status: 'kommer_ikke', reason: reason.trim() },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre svaret', error.message),
      }
    );

  return (
    <View className="gap-5 px-4 pb-8 pt-6">
      <View>
        <Text variant="h4">Hvorfor kan du ikke komme?</Text>
        {event && <Text className="text-muted-foreground text-sm">{event.title}</Text>}
      </View>

      <View className="gap-2">
        <Textarea
          value={reason}
          onChangeText={setReason}
          placeholder="F.eks. syk, eksamen, jobb"
          maxLength={300}
          numberOfLines={3}
          autoFocus
        />
        <Text className="text-muted-foreground text-xs">
          Begrunnelsen vises for alle som ser arrangementet.
        </Text>
      </View>

      <Button
        size="lg"
        className="rounded-full bg-red-600 active:bg-red-700"
        disabled={!reason.trim() || setAttendance.isPending}
        onPress={save}>
        <Text className="text-white">Meld avbud</Text>
      </Button>
    </View>
  );
}
