import { Link } from 'expo-router';
import { CalendarClock, ChevronRight, CircleCheck, Clock, Smartphone } from 'lucide-react-native';
import { Alert, Linking, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useSetPaid } from '@/data/hooks';
import type { PaymentRequest } from '@/data/types';
import { formatEventStart, formatRelative } from '@/lib/dates';

async function openVipps(vippsNumber: string) {
  try {
    await Linking.openURL('vipps://');
  } catch {
    Alert.alert('Fant ikke Vipps', `Betal ${vippsNumber} manuelt i Vipps eller nettbanken.`);
  }
}

/**
 * Betalingsoppfordring postet av sub-/admin. Man betaler utenfor appen (Vipps) og markerer selv at
 * man har betalt. Sub-/admin sjekker Vipps og godkjenner, og trykker på kortet for å gjøre det.
 */
export function PaymentCard({ payment }: { payment: PaymentRequest }) {
  const setPaid = useSetPaid(payment.id);
  const { memberCount, approvedCount, pendingCount, myStatus } = payment;
  const mark = (paid: boolean) =>
    setPaid.mutate(paid, { onError: (error) => Alert.alert('Kunne ikke lagre', error.message) });

  const card = (
    <View className="bg-muted/60 gap-3 rounded-2xl p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold">{payment.title}</Text>
          <Text className="text-muted-foreground text-xs">
            {payment.createdByName} · {formatRelative(payment.createdAt)}
          </Text>
        </View>
        <Text className="text-xl font-bold">{payment.amount} kr</Text>
      </View>

      {payment.description ? (
        <Text className="text-sm leading-5">{payment.description}</Text>
      ) : null}

      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          <Icon as={Smartphone} size={14} className="text-muted-foreground" />
          <Text className="text-sm">
            Vipps til <Text className="text-sm font-semibold">{payment.vippsNumber}</Text>
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Icon as={CalendarClock} size={14} className="text-muted-foreground" />
          <Text className="text-sm">Frist {formatEventStart(payment.dueDate)}</Text>
        </View>
      </View>

      {payment.canManage && (
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-xs">
              {approvedCount} av {memberCount} har betalt
              {pendingCount > 0 && (
                <Text className="text-xs font-semibold text-amber-600">
                  {' '}
                  · {pendingCount} venter
                </Text>
              )}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-muted-foreground text-xs">Se og godkjenn</Text>
              <Icon as={ChevronRight} size={14} className="text-muted-foreground" />
            </View>
          </View>
          <Progress value={(approvedCount / memberCount) * 100} indicatorClassName="bg-green-500" />
        </View>
      )}

      <View className="flex-row gap-2">
        <Button
          variant="secondary"
          className="flex-1 rounded-full"
          onPress={() => openVipps(payment.vippsNumber)}>
          <Text>Åpne Vipps</Text>
        </Button>
        <PaidButton
          status={myStatus}
          disabled={setPaid.isPending}
          onMark={() => mark(true)}
          onUndo={() =>
            Alert.alert('Angre «Jeg har betalt»?', undefined, [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Angre', style: 'destructive', onPress: () => mark(false) },
            ])
          }
        />
      </View>

      {myStatus === 'rejected' && (
        <Text className="text-destructive text-sm">
          Betalingen ble avvist. Sjekk at du har betalt riktig beløp.
        </Text>
      )}
    </View>
  );

  if (!payment.canManage) return card;
  return (
    <Link href={`/grupper/${payment.groupId}/betaling/${payment.id}`} asChild>
      <Pressable className="active:opacity-80">{card}</Pressable>
    </Link>
  );
}

/** «Jeg har betalt» → gul «Venter på godkjenning» → grønn «Betalt» når sub/admin har godkjent. */
function PaidButton({
  status,
  disabled,
  onMark,
  onUndo,
}: {
  status: PaymentRequest['myStatus'];
  disabled: boolean;
  onMark: () => void;
  onUndo: () => void;
}) {
  if (status === 'approved') {
    return (
      <View className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-green-600 px-4">
        <Icon as={CircleCheck} size={16} className="text-white" />
        <Text className="font-medium text-white">Betalt</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <Button
        className="flex-1 rounded-full bg-amber-500 active:bg-amber-600"
        disabled={disabled}
        onPress={onUndo}
        accessibilityHint="Trykk for å angre">
        <Icon as={Clock} size={16} className="text-white" />
        <Text className="text-white">Venter på godkjenning</Text>
      </Button>
    );
  }
  return (
    <Button variant="outline" className="flex-1 rounded-full" disabled={disabled} onPress={onMark}>
      <Text>Jeg har betalt</Text>
    </Button>
  );
}
