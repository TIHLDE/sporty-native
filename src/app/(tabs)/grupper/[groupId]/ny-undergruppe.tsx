import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Switch, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { ColorPicker } from '@/components/sporty/color-picker';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { MemberPicker } from '@/components/sporty/member-picker';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSubgroup, useGroup } from '@/data/hooks';
import type { GroupDetails } from '@/data/types';
import { GROUP_COLORS } from '@/lib/group-colors';
import { ACCENT } from '@/lib/theme';

/** (Admin) Lag en undergruppe, f.eks. et 11'er-lag, med medlemmer fra hovedgruppen. */
export default function NyUndergruppeScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(data) => <Form parent={data} />}</QueryState>;
}

function Form({ parent }: { parent: GroupDetails }) {
  const create = useCreateSubgroup(parent.id);
  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0]);
  const [description, setDescription] = useState('');
  const [usesPositions, setUsesPositions] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const submit = () =>
    create.mutate(
      { name: name.trim(), color, description: description.trim(), usesPositions, memberIds },
      {
        onSuccess: (subgroup) => {
          router.back();
          // Med posisjoner er neste steg å lage posisjonslisten.
          if (usesPositions) router.push(`/grupper/${subgroup.id}/posisjoner`);
        },
        onError: (error) => Alert.alert('Kunne ikke lage undergruppen', error.message),
      }
    );

  return (
    <View className="flex-1">
      <FormScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 p-4 pb-8">
        <Field label="Navn">
          <Input value={name} onChangeText={setName} placeholder="F.eks. 11'er" maxLength={60} />
        </Field>

        <Field label="Farge">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <Field label="Beskrivelse (valgfritt)">
          <Textarea value={description} onChangeText={setDescription} maxLength={1000} />
        </Field>

        <View className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3">
          <View className="flex-1">
            <Text>Bruk posisjoner</Text>
            <Text className="text-muted-foreground text-xs">
              Du lager posisjonslisten selv, f.eks. Keeper og Spiss eller Kant og Linje
            </Text>
          </View>
          <Switch
            value={usesPositions}
            onValueChange={setUsesPositions}
            trackColor={{ true: ACCENT }}
          />
        </View>

        <Field label={`Medlemmer fra ${parent.name}`}>
          <MemberPicker
            users={parent.members.map((m) => m.user)}
            selected={memberIds}
            onChange={setMemberIds}
          />
        </Field>
      </FormScrollView>
      <BottomBar>
        <Button
          size="lg"
          className="bg-brand active:bg-brand/80 rounded-full"
          disabled={!name.trim() || create.isPending}
          onPress={submit}>
          <Text className="text-white">Lag undergruppe</Text>
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
