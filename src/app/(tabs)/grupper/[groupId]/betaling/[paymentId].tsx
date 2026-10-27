import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, useGroupPayments, useReviewPayment } from '@/data/hooks';
import type { PaymentRequest, PaymentStatus, User } from '@/data/types';
import { formatEventStart } from '@/lib/dates';

/**
 * (Sub-/admin) Hvem som har betalt. De som har trykket «Jeg har betalt» venter til noen har sjekket
 * Vipps og godkjent eller avvist.
 */
export default function BetalingScreen() {
  const { groupId, paymentId } = useLocalSearchParams<{ groupId: string; paymentId: string }>();
  const payments = useGroupPayments(groupId);
  const group = useGroup(groupId);
  const payment = payments.data?.find((p) => p.id === paymentId);

  if (payments.isPending || group.isPending) return <ActivityIndicator className="py-10" />;
  if (!payment || !group.data) return <EmptyState text="Fant ikke betalingen" />;
  return <PaymentDetails payment={payment} members={group.data.members.map((m) => m.user)} />;
}

function PaymentDetails({ payment, members }: { payment: PaymentRequest; members: User[] }) {
  const review = useReviewPayment(payment.id);
  const confirmations = payment.confirmations ?? [];
  const byStatus = (status: PaymentStatus) =>
    confirmations.filter((c) => c.status === status).map((c) => c.user);
  const confirmed = new Set(confirmations.map((c) => c.user.id));
  const unpaid = members
    .filter((u) => !confirmed.has(u.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const decide = (user: User, status: 'approved' | 'rejected') =>
    review.mutate(
      { userId: user.id, status },
      { onError: (error) => Alert.alert('Kunne ikke lagre', error.message) }
    );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      <View className="gap-1">
        <Text variant="h4">{payment.title}</Text>
        <Text className="text-muted-foreground text-sm">
          {payment.amount} kr · Vipps {payment.vippsNumber} · Frist{' '}
          {formatEventStart(payment.dueDate)}
        </Text>
        <Text className="text-muted-foreground text-sm">
          {payment.approvedCount} av {payment.memberCount} har betalt. Sjekk Vipps før du
          godkjenner.
        </Text>
      </View>

      <Section title="Venter på godkjenning" users={byStatus('pending')}>
        {(user) => (
          <View className="flex-row gap-2">
            <Button
              size="sm"
              className="bg-brand active:bg-brand/80 rounded-full"
              disabled={review.isPending}
              onPress={() => decide(user, 'approved')}>
              <Text className="text-white">Godkjenn</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={review.isPending}
              onPress={() => decide(user, 'rejected')}>
              <Text className="text-destructive">Avvis</Text>
            </Button>
          </View>
        )}
      </Section>
      <Section title="Betalt" users={byStatus('approved')} />
      <Section title="Avvist" users={byStatus('rejected')} />
      <Section title="Ikke betalt" users={unpaid} />
    </ScrollView>
  );
}

function Section({
  title,
  users,
  children,
}: {
  title: string;
  users: User[];
  children?: (user: User) => ReactNode;
}) {
  if (users.length === 0) return null;
  return (
    <View>
      <Text className="text-muted-foreground pb-1 text-xs font-medium uppercase">
        {title} ({users.length})
      </Text>
      {users.map((user, index) => (
        <View key={user.id}>
          {index > 0 && <Separator />}
          <View className="flex-row items-center gap-3 py-2.5">
            <UserAvatar user={user} className="size-9" />
            <Text className="flex-1 font-medium" numberOfLines={1}>
              {user.name}
            </Text>
            {children?.(user)}
          </View>
        </View>
      ))}
    </View>
  );
}
