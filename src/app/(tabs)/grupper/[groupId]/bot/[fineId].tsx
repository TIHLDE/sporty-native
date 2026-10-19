import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useAccessToken, useFine, useGroup, useSetFineStatus } from '@/data/hooks';
import type { Fine, FineStatus } from '@/data/types';
import { formatEventStart } from '@/lib/dates';
import { FINE_STATUS_LABEL, formatFineCount, formatLaw } from '@/lib/fines';

/** Én bot: hvem, paragraf, begrunnelse, forsvar og bilde. Botsjef og leder kan godkjenne her. */
export default function BotScreen() {
  const { groupId, fineId } = useLocalSearchParams<{ groupId: string; fineId: string }>();
  const fine = useFine(groupId, fineId);
  const canSettle = useGroup(groupId).data?.fines.canSettle ?? false;

  return (
    <QueryState query={fine}>
      {(data) => <FineDetails fine={data} canSettle={canSettle && data.source === 'tihlde'} />}
    </QueryState>
  );
}

function FineDetails({ fine, canSettle }: { fine: Fine; canSettle: boolean }) {
  const settled = fine.status === 'paid' || fine.status === 'rejected';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      <View className="items-center gap-2">
        <UserAvatar user={fine.user} className="size-20" />
        <Text variant="h4">{fine.user.name}</Text>
        <Text variant="h2">{formatFineCount(fine.count)}</Text>
        <Badge variant={settled ? 'secondary' : 'outline'}>
          <Text>{FINE_STATUS_LABEL[fine.status]}</Text>
        </Badge>
      </View>

      <View className="bg-muted/60 rounded-2xl px-4">
        <Row label="Paragraf">{formatLaw(fine.law)}</Row>
        <Separator />
        <Row label="Begrunnelse">{fine.reason}</Row>
        <Separator />
        <Row label="Gitt av">{fine.collective ? 'Fellesbot' : fine.givenByName}</Row>
        <Separator />
        <Row label="Når">{formatEventStart(fine.createdAt)}</Row>
        {fine.defense && (
          <>
            <Separator />
            <Row label="Forsvar">{fine.defense}</Row>
          </>
        )}
      </View>

      {fine.imageUrl && <FineImage fine={fine} />}

      {canSettle && <SettleButtons fine={fine} />}

      {fine.source === 'tihlde' && (
        <Text className="text-muted-foreground text-center text-xs">
          Boten ligger på tihlde.org
        </Text>
      )}
    </ScrollView>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-0.5 py-3">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text>{children}</Text>
    </View>
  );
}

/** Bilder fra tihlde.org er private og hentes med innloggingen. */
function FineImage({ fine }: { fine: Fine }) {
  const token = useAccessToken();
  if (fine.source === 'tihlde' && !token.data) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Image
      source={{
        uri: fine.imageUrl!,
        headers: fine.source === 'tihlde' ? { authorization: `Bearer ${token.data}` } : undefined,
      }}
      accessibilityLabel={`Bilde til boten til ${fine.user.name}`}
      style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16 }}
      contentFit="contain"
    />
  );
}

/** Godkjenn, marker som betalt, avvis eller sett tilbake (botsjef og leder på tihlde.org). */
function SettleButtons({ fine }: { fine: Fine }) {
  const setStatus = useSetFineStatus(fine.groupId);
  const change = (status: FineStatus) =>
    setStatus.mutate(
      { fineId: fine.id, status },
      { onError: (error) => Alert.alert('Kunne ikke endre boten', error.message) }
    );

  const actions: { label: string; status: FineStatus; primary?: boolean; destructive?: boolean }[] =
    fine.status === 'pending'
      ? [
          { label: 'Godkjenn', status: 'approved', primary: true },
          { label: 'Avvis', status: 'rejected', destructive: true },
        ]
      : fine.status === 'approved'
        ? [
            { label: 'Marker som betalt', status: 'paid', primary: true },
            { label: 'Avvis', status: 'rejected', destructive: true },
          ]
        : [{ label: 'Sett tilbake til venter', status: 'pending' }];

  return (
    <View className="gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          size="lg"
          variant={action.primary ? 'default' : 'outline'}
          className={action.primary ? 'bg-brand active:bg-brand/80 rounded-full' : 'rounded-full'}
          disabled={setStatus.isPending}
          onPress={() => change(action.status)}>
          <Text
            className={
              action.primary ? 'text-white' : action.destructive ? 'text-destructive' : undefined
            }>
            {action.label}
          </Text>
        </Button>
      ))}
    </View>
  );
}
