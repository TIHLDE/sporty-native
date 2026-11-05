import { Image } from 'expo-image';
import { Alert, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useReports, useResolveReport } from '@/data/moderation';
import type { MessageReport } from '@/data/types';
import { formatRelative } from '@/lib/dates';
import { REPORT_REASONS } from '@/lib/messages';

/** Åpne rapporter for sub-/admin og Index. */
export default function RapporterScreen() {
  const reports = useReports();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-3 p-4 pb-16">
      <Text className="text-muted-foreground text-sm">
        Meldinger og kommentarer som er rapportert i gruppene dine. Behandle dem innen 24 timer.
      </Text>
      <QueryState query={reports}>
        {(data) =>
          data.length === 0 ? (
            <EmptyState text="Ingen åpne rapporter" />
          ) : (
            data.map((report) => <ReportCard key={report.id} report={report} />)
          )
        }
      </QueryState>
    </ScrollView>
  );
}

function ReportCard({ report }: { report: MessageReport }) {
  const resolve = useResolveReport();
  const reason = REPORT_REASONS.find((r) => r.value === report.reason)?.label ?? report.reason;
  const act = (action: 'remove' | 'dismiss') =>
    resolve.mutate(
      { reportId: report.id, action },
      { onError: (error) => Alert.alert('Rapporten ble ikke behandlet', error.message) }
    );

  return (
    <View className="bg-muted/60 gap-3 rounded-2xl p-4">
      <View className="flex-row items-center gap-3">
        <UserAvatar user={report.sender} className="size-9" />
        <View className="flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {report.sender.name}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {report.groupName ?? 'Direktemelding'} · {reason} · {formatRelative(report.createdAt)}
          </Text>
        </View>
      </View>
      {report.gifUrl ? (
        <Image
          source={{ uri: report.gifUrl }}
          accessibilityLabel="Rapportert GIF"
          contentFit="cover"
          style={{ width: 180, height: 130, borderRadius: 10 }}
        />
      ) : (
        <Text>{report.body}</Text>
      )}
      <Text className="text-muted-foreground text-xs">Rapportert av {report.reporter.name}</Text>
      <View className="flex-row gap-2">
        <Button
          variant="destructive"
          className="flex-1 rounded-full"
          disabled={resolve.isPending}
          onPress={() => act('remove')}>
          <Text>{report.kind === 'comment' ? 'Slett kommentaren' : 'Slett meldingen'}</Text>
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-full"
          disabled={resolve.isPending}
          onPress={() => act('dismiss')}>
          <Text>Avvis</Text>
        </Button>
      </View>
    </View>
  );
}
