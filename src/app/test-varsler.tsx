import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarClock, Gavel, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useUpcomingEvents } from '@/data/hooks';
import type { Event } from '@/data/types';
import { api } from '@/lib/api';
import { formatDateTimeShort } from '@/lib/dates';
import {
  REMINDER_LEAD_MS,
  eventStartContent,
  fineContent,
  signupDeadlineContent,
  type NotificationContent,
} from '@/lib/notification-content';
import { getScheduledReminders, showNotification } from '@/lib/notifications';

const DELAY_SECONDS = 5;

/** Brukes når det ikke finnes noen kommende arrangementer å vise påminnelsen for. */
function sampleEvent(): Event {
  const start = new Date(Date.now() + REMINDER_LEAD_MS);
  return {
    id: 'eksempel',
    groupId: 'herrer',
    groupName: 'Pythons Herrer',
    title: 'Trening',
    type: 'trening',
    opponent: null,
    description: '',
    location: { name: 'Gløshaugen idrettsbygg', latitude: 63.4152, longitude: 10.4064 },
    start: start.toISOString(),
    end: null,
    signupDeadline: start.toISOString(),
    ourScore: null,
    theirScore: null,
    attendance: {},
    memberIds: [],
    canManage: false,
    canGiveFines: false,
  };
}

/** Kun i utvikling: vis hvordan de ulike varslene ser ut, uten å vente på at de skjer. */
export default function TestVarslerScreen() {
  const events = useUpcomingEvents();
  const [delayed, setDelayed] = useState(false);
  const reminders = useQuery({
    queryKey: ['scheduled-reminders'],
    queryFn: getScheduledReminders,
    staleTime: 0,
  });

  const event = events.data?.[0] ?? sampleEvent();
  const withDeadline = events.data?.find((e) => e.signupDeadline) ?? sampleEvent();

  const samples: { icon: typeof Bell; label: string; content: NotificationContent }[] = [
    {
      icon: Gavel,
      label: 'Fått bot',
      content: fineContent({
        count: 2,
        groupId: 'herrer',
        groupName: 'Pythons Herrer',
        paragraph: '1.00',
        lawTitle: 'Oppmøte',
        reason: 'Kom 10 minutter for sent på trening',
      }),
    },
    { icon: CalendarClock, label: '1 time før arrangement', content: eventStartContent(event) },
    {
      icon: Bell,
      label: '1 time før påmeldingsfrist (ikke svart)',
      content: signupDeadlineContent({
        ...withDeadline,
        signupDeadline: withDeadline.signupDeadline ?? withDeadline.start,
      }),
    },
  ];

  const send = async (content: NotificationContent) => {
    try {
      await showNotification(content, delayed ? DELAY_SECONDS : 0);
    } catch (error) {
      Alert.alert('Kunne ikke vise varselet', (error as Error).message);
    }
  };

  const sendRealPush = async () => {
    try {
      const { devices } = await api<{ devices: number }>('/push-tokens/test', { method: 'POST' });
      Alert.alert('Sendt', `Push sendt til ${devices} ${devices === 1 ? 'enhet' : 'enheter'}.`);
    } catch (error) {
      Alert.alert('Kunne ikke sende push', (error as Error).message);
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-6 p-4 pb-12">
      <Text className="text-muted-foreground text-sm">
        Trykk på et varsel for å vise det med en gang. Påminnelsene bruker ditt nærmeste
        arrangement hvis du har et.
      </Text>

      <View className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3">
        <View className="flex-1">
          <Text>Vent {DELAY_SECONDS} sekunder</Text>
          <Text className="text-muted-foreground text-xs">
            Så du rekker å låse skjermen eller lukke appen
          </Text>
        </View>
        <Switch checked={delayed} onCheckedChange={setDelayed} />
      </View>

      <View className="bg-muted/60 rounded-2xl px-4">
        {samples.map((sample, index) => (
          <View key={sample.label}>
            {index > 0 && <Separator />}
            <Pressable
              onPress={() => send(sample.content)}
              className="flex-row items-center gap-3 py-3 active:opacity-70">
              <Icon as={sample.icon} size={18} />
              <View className="flex-1 gap-0.5">
                <Text className="font-medium">{sample.label}</Text>
                <Text className="text-muted-foreground text-xs" numberOfLines={2}>
                  {sample.content.title} — {sample.content.body}
                </Text>
              </View>
              <Icon as={Send} size={16} className="text-brand" />
            </Pressable>
          </View>
        ))}
      </View>

      <View className="gap-2">
        <Button variant="outline" className="rounded-full" onPress={sendRealPush}>
          <Text>Send ekte push (bot) til meg</Text>
        </Button>
        <Text className="text-muted-foreground text-xs">
          Går via serveren og Expo Push Service, akkurat som en ekte bot. Krever development build
          og EAS-prosjekt.
        </Text>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground text-sm font-medium">Planlagte påminnelser</Text>
          <Pressable onPress={() => reminders.refetch()} hitSlop={8}>
            <Text className="text-brand text-sm">Oppdater</Text>
          </Pressable>
        </View>
        <View className="bg-muted/60 rounded-2xl px-4">
          {reminders.data?.length ? (
            reminders.data.map((r, index) => (
              <View key={r.id}>
                {index > 0 && <Separator />}
                <View className="py-3">
                  <Text>{r.title}</Text>
                  <Text className="text-muted-foreground text-xs">
                    {r.at ? formatDateTimeShort(new Date(r.at)) : 'Ukjent tidspunkt'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-muted-foreground py-3 text-sm">
              {reminders.isPending ? 'Henter …' : 'Ingen planlagte påminnelser'}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
