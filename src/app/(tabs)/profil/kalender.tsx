import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { updateCalendarSettings, useCalendarSettings } from '@/data/calendar-settings';
import {
  getWritableCalendars,
  requestCalendarAccess,
  type WritableCalendar,
} from '@/lib/calendar-sync';

/** Velg kalenderen arrangementene skal legges i. Spør om kalendertilgang første gang. */
export default function KalenderScreen() {
  const settings = useCalendarSettings();
  const calendars = useQuery({
    queryKey: ['device-calendars'],
    queryFn: async () => ((await requestCalendarAccess()) ? getWritableCalendars() : null),
    staleTime: 0,
  });

  const choose = (calendar: WritableCalendar | null) => {
    updateCalendarSettings({
      calendarId: calendar?.id ?? null,
      calendarTitle: calendar?.title ?? null,
    });
    router.back();
  };

  if (calendars.isPending) return <ActivityIndicator className="flex-1" />;

  if (calendars.isError || calendars.data === null) {
    return (
      <View className="gap-4 p-6">
        <Text className="text-muted-foreground">
          {calendars.isError
            ? `Kunne ikke hente kalenderne: ${calendars.error.message}`
            : 'Sporty trenger tilgang til kalenderen for å legge inn arrangementer. Gi tilgang i innstillingene på telefonen.'}
        </Text>
        <Button
          className="bg-brand active:bg-brand/80 self-start rounded-full"
          onPress={() => Linking.openSettings()}>
          <Text className="text-white">Åpne innstillinger</Text>
        </Button>
      </View>
    );
  }

  // Gruppér etter konto (iCloud, Google-kontoer osv.), som i kalenderappen.
  const byAccount = new Map<string, WritableCalendar[]>();
  for (const calendar of calendars.data) {
    byAccount.set(calendar.account, [...(byAccount.get(calendar.account) ?? []), calendar]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      <View className="bg-muted/60 rounded-2xl px-4">
        <Option label="Av" selected={!settings.calendarId} onPress={() => choose(null)} />
      </View>

      {[...byAccount].map(([account, items]) => (
        <View key={account} className="gap-2">
          {account ? (
            <Text className="text-muted-foreground px-1 text-sm font-medium">{account}</Text>
          ) : null}
          <View className="bg-muted/60 rounded-2xl px-4">
            {items.map((calendar, index) => (
              <View key={calendar.id}>
                {index > 0 && <Separator />}
                <Option
                  label={calendar.title}
                  color={calendar.color}
                  selected={settings.calendarId === calendar.id}
                  onPress={() => choose(calendar)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Option({
  label,
  color,
  selected,
  onPress,
}: {
  label: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-3.5 active:opacity-70">
      {color && <View className="size-3 rounded-full" style={{ backgroundColor: color }} />}
      <Text className="flex-1">{label}</Text>
      {selected && <Icon as={Check} size={18} className="text-brand" />}
    </Pressable>
  );
}
