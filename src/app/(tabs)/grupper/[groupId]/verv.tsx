import { useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { ExternalLink } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useOfficeHistory } from '@/data/hooks';
import type { OfficeHistory, OfficePeriod } from '@/data/types';
import { websiteUrl } from '@/lib/api';
import { formatDateOnlyRange, todayDateOnly } from '@/lib/dates';

/**
 * Vervhistorikken til laget: hvem som hadde hvilke verv, periode for periode, nyeste først. Bare
 * visning. Admin i hovedgruppen lager vervene og periodene på nettsiden, siden det gjøres sjelden
 * og er lettere på stor skjerm.
 */
export default function VervScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const history = useOfficeHistory(groupId);
  return <QueryState query={history}>{(data) => <History history={data} />}</QueryState>;
}

function History({ history }: { history: OfficeHistory }) {
  const today = todayDateOnly();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      {history.canEdit && <EditOnWebsite groupId={history.groupId} />}
      {history.periods.length === 0 ? (
        <EmptyState
          text={
            history.canEdit
              ? 'Ingen vervhistorikk ennå. Lag vervene og periodene på nettsiden.'
              : 'Ingen vervhistorikk ennå.'
          }
        />
      ) : (
        history.periods.map((period) => (
          <Period
            key={period.id}
            period={period}
            current={period.from <= today && today <= period.to}
          />
        ))
      )}
    </ScrollView>
  );
}

function Period({ period, current }: { period: OfficePeriod; current: boolean }) {
  const dates = formatDateOnlyRange(period.from, period.to);
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2 px-1">
        <View className="flex-1">
          <Text className="font-semibold">{period.name || dates}</Text>
          {period.name ? <Text className="text-muted-foreground text-xs">{dates}</Text> : null}
        </View>
        {current && (
          <Badge variant="secondary">
            <Text>Nå</Text>
          </Badge>
        )}
      </View>
      <View className="bg-muted/60 rounded-2xl px-4">
        {period.holders.length === 0 ? (
          <Text className="text-muted-foreground py-3.5 text-sm">Ingen verv er fordelt.</Text>
        ) : (
          period.holders.map(({ office, users }, index) => (
            <View key={office.id}>
              {index > 0 && <Separator />}
              <View className="flex-row gap-3 py-3">
                <Text className="text-muted-foreground w-36 text-sm">{office.name}</Text>
                <Text className="flex-1 text-sm font-medium">
                  {users.map((u) => u.name).join('\n')}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

/** (Admin i hovedgruppen) Vervene og periodene endres på nettsiden. */
function EditOnWebsite({ groupId }: { groupId: string }) {
  const open = () =>
    openBrowserAsync(websiteUrl(`/grupper/${groupId}/innstillinger`), {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  return (
    <Pressable
      onPress={open}
      className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-70">
      <View className="flex-1">
        <Text className="font-medium">Endre på nettsiden</Text>
        <Text className="text-muted-foreground text-xs">
          Vervene og periodene lages under Innstillinger på nettsiden
        </Text>
      </View>
      <Icon as={ExternalLink} size={18} className="text-muted-foreground" />
    </Pressable>
  );
}
