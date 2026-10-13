import { CalendarClock, CircleCheck, Smartphone } from 'lucide-react-native';
import { Alert, Linking, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useSetPaid } from '@/data/hooks';
import { useSession } from '@/data/session';
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
 * Betalingsoppfordring postet av sub-/admin. Man betaler utenfor appen (Vipps),
 * og markerer selv at man har betalt.
 */
export function PaymentCard({ payment }: { payment: PaymentRequest }) {
  const { userId } = useSession();
  const setPaid = useSetPaid(payment.id);
  const { memberCount } = payment;
  const paidCount = payment.paidUserIds.length;
  const iHavePaid = payment.paidUserIds.includes(userId);

  return (
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

      {payment.description ? <Text className="text-sm leading-5">{payment.description}</Text> : null}

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
          <Text className="text-muted-foreground text-xs">
            {paidCount} av {memberCount} har betalt
          </Text>
          <Progress value={(paidCount / memberCount) * 100} indicatorClassName="bg-green-500" />
        </View>
      )}

      <View className="flex-row gap-2">
        <Button variant="secondary" className="flex-1 rounded-full" onPress={() => openVipps(payment.vippsNumber)}>
          <Text>Åpne Vipps</Text>
        </Button>
        <Button
          variant={iHavePaid ? 'default' : 'outline'}
          className={iHavePaid ? 'flex-1 rounded-full bg-green-600 active:bg-green-700' : 'flex-1 rounded-full'}
          disabled={setPaid.isPending}
          onPress={() =>
            setPaid.mutate(!iHavePaid, { onError: (error) => Alert.alert('Kunne ikke lagre', error.message) })
          }>
          {iHavePaid && <Icon as={CircleCheck} size={16} className="text-white" />}
          <Text className={iHavePaid ? 'text-white' : undefined}>
            {iHavePaid ? 'Betalt' : 'Jeg har betalt'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
