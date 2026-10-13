import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { DateTimeField } from '@/components/sporty/date-time-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePayment, useGroup } from '@/data/hooks';

/** Om to uker kl. 23:59, en fornuftig standardfrist. */
function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setHours(23, 59, 0, 0);
  return date;
}

/** (Sub-/admin) Post en betalingsoppfordring. Selve betalingen skjer i Vipps, ikke i appen. */
export default function NyBetalingScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId).data;
  const createPayment = useCreatePayment(groupId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [vippsNumber, setVippsNumber] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [description, setDescription] = useState('');

  const dueDateInPast = dueDate <= new Date();
  const canSubmit = Boolean(
    title.trim() && Number(amount) > 0 && vippsNumber.trim() && !dueDateInPast
  );

  const submit = () =>
    createPayment.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        vippsNumber: vippsNumber.trim(),
        dueDate: dueDate.toISOString(),
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke publisere', error.message),
      }
    );

  return (
    <View className="flex-1">
      <FormScrollView
        contentContainerClassName="gap-5 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        {group && (
          <Text className="text-muted-foreground text-sm">
            Medlemmene i {group.name} får beskjed og betaler selv med Vipps.
          </Text>
        )}

        <Field label="Tittel">
          <Input value={title} onChangeText={setTitle} placeholder="F.eks. Nye drakter" />
        </Field>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Beløp (kr)">
              <Input
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="350"
              />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Vipps-nummer">
              <Input
                value={vippsNumber}
                onChangeText={setVippsNumber}
                keyboardType="phone-pad"
                placeholder="123 45 678"
              />
            </Field>
          </View>
        </View>

        <Field label="Frist">
          <DateTimeField value={dueDate} onChange={setDueDate} minimumDate={new Date()} />
          {dueDateInPast && (
            <Text className="text-destructive text-sm">Fristen må være frem i tid</Text>
          )}
        </Field>

        <Field label="Beskrivelse (valgfritt)">
          <Textarea
            value={description}
            onChangeText={setDescription}
            placeholder="Hva gjelder betalingen?"
          />
        </Field>
      </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          disabled={!canSubmit || createPayment.isPending}
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}>
          <Text className="text-white">Publiser betaling</Text>
        </Button>
      </BottomBar>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      {children}
    </View>
  );
}
