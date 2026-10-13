import { router, useLocalSearchParams } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { DateTimeField } from '@/components/sporty/date-time-field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePoll, useGroup } from '@/data/hooks';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 20;

/** Om tre dager kl. 23:59, en fornuftig standardfrist. */
function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(23, 59, 0, 0);
  return date;
}

let nextKey = 0;
const newOption = () => ({ key: nextKey++, text: '' });

/** (Sub-/admin) Lag en avstemning for gruppen. */
export default function NyAvstemningScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId).data;
  const createPoll = useCreatePoll(groupId);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(() => [newOption(), newOption()]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [hideVotes, setHideVotes] = useState(false);
  const [closesAt, setClosesAt] = useState(defaultDeadline);
  const [allowComments, setAllowComments] = useState(true);

  const filled = options.map((o) => o.text.trim()).filter(Boolean);
  const hasDuplicates = new Set(filled.map((o) => o.toLowerCase())).size !== filled.length;
  const deadlineInPast = closesAt <= new Date();
  const canSubmit =
    Boolean(question.trim()) &&
    filled.length >= MIN_OPTIONS &&
    !hasDuplicates &&
    !deadlineInPast &&
    !createPoll.isPending;

  const setOptionText = (key: number, text: string) =>
    setOptions((current) => current.map((o) => (o.key === key ? { ...o, text } : o)));
  const removeOption = (key: number) =>
    setOptions((current) => current.filter((o) => o.key !== key));

  const submit = () =>
    createPoll.mutate(
      {
        question: question.trim(),
        description: description.trim(),
        options: filled,
        allowMultiple,
        hideVotes,
        allowComments,
        closesAt: closesAt.toISOString(),
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lage avstemning', error.message),
      }
    );

  return (
    <View className="flex-1">
      <FormScrollView
        contentContainerClassName="gap-6 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        {group && (
          <Text className="text-muted-foreground text-sm">
            Alle i {group.name} får varsel om avstemningen.
          </Text>
        )}

        <Field label="Spørsmål">
          <Input
            value={question}
            onChangeText={setQuestion}
            placeholder="F.eks. Hvilken dag passer best for lagfest?"
          />
        </Field>

        <Field label="Beskrivelse (valgfritt)">
          <Textarea
            value={description}
            onChangeText={setDescription}
            placeholder="Mer informasjon om avstemningen"
          />
        </Field>

        <Field label="Alternativer">
          {options.map((option, index) => (
            <View key={option.key} className="flex-row items-center gap-2">
              <Input
                className="flex-1"
                value={option.text}
                onChangeText={(text) => setOptionText(option.key, text)}
                placeholder={`Alternativ ${index + 1}`}
              />
              {options.length > MIN_OPTIONS && (
                <Pressable onPress={() => removeOption(option.key)} hitSlop={8} className="p-1">
                  <Icon as={X} size={18} className="text-muted-foreground" />
                </Pressable>
              )}
            </View>
          ))}
          {hasDuplicates && (
            <Text className="text-destructive text-sm">To alternativer er like</Text>
          )}
          {options.length < MAX_OPTIONS && (
            <Pressable
              onPress={() => setOptions((current) => [...current, newOption()])}
              className="border-border flex-row items-center justify-center gap-2 rounded-2xl border border-dashed py-3 active:opacity-70">
              <Icon as={Plus} size={18} className="text-brand" />
              <Text className="text-brand font-medium">Legg til alternativ</Text>
            </Pressable>
          )}
        </Field>

        <ToggleRow
          label="Tillat å stemme på flere valg"
          description="Medlemmene kan krysse av for flere alternativer"
          value={allowMultiple}
          onChange={setAllowMultiple}
        />
        <ToggleRow
          label="Skjul stemmene"
          description="Resultatet vises først når fristen har gått ut. Sub-/admin ser det hele tiden"
          value={hideVotes}
          onChange={setHideVotes}
        />

        <Field label="Frist">
          <DateTimeField value={closesAt} onChange={setClosesAt} minimumDate={new Date()} />
          {deadlineInPast && (
            <Text className="text-destructive text-sm">Fristen må være frem i tid</Text>
          )}
        </Field>

        <ToggleRow
          label="Tillat kommentarer"
          description="Medlemmene kan diskutere under avstemningen"
          value={allowComments}
          onChange={setAllowComments}
        />
      </FormScrollView>

      <BottomBar>
        <Button
          size="lg"
          disabled={!canSubmit}
          className="bg-brand active:bg-brand/80 rounded-full"
          onPress={submit}>
          <Text className="text-white">Lag avstemning</Text>
        </Button>
      </BottomBar>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Label>{label}</Label>
        <Text className="text-muted-foreground text-xs">{description}</Text>
      </View>
      <Switch checked={value} onCheckedChange={onChange} />
    </View>
  );
}
