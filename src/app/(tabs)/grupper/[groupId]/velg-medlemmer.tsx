import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { MemberPicker } from '@/components/sporty/member-picker';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGroup, useSetSubgroupMembers } from '@/data/hooks';
import type { GroupDetails } from '@/data/types';

/** (Admin) Velg hvem fra hovedgruppen som er med i undergruppen. */
export default function VelgMedlemmerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(subgroup) => <WithParent subgroup={subgroup} />}</QueryState>;
}

/** Hovedgruppen hentes først når vi vet hvilken det er. */
function WithParent({ subgroup }: { subgroup: GroupDetails }) {
  const parent = useGroup(subgroup.parentId!);
  return (
    <QueryState query={parent}>
      {(parentData) => <Picker subgroup={subgroup} parent={parentData} />}
    </QueryState>
  );
}

function Picker({ subgroup, parent }: { subgroup: GroupDetails; parent: GroupDetails }) {
  const save = useSetSubgroupMembers(subgroup.id);
  const [selected, setSelected] = useState(subgroup.members.map((m) => m.user.id));
  const removed = subgroup.members.filter((m) => !selected.includes(m.user.id));

  const submit = () => {
    const run = () =>
      save.mutate(selected, {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre', error.message),
      });
    if (removed.length === 0) return run();
    Alert.alert(
      `Fjerne ${removed.length === 1 ? removed[0].user.name : `${removed.length} medlemmer`}?`,
      'De mister tilgangen til arrangementer, chat og alt annet i undergruppen, og svarene deres på kommende arrangementer slettes.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Fjern', style: 'destructive', onPress: run },
      ]
    );
  };

  return (
    <View className="flex-1">
      <FormScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 p-4 pb-8">
        <Text className="text-muted-foreground text-sm">Medlemmene hentes fra {parent.name}.</Text>
        <MemberPicker
          users={parent.members.map((m) => m.user)}
          selected={selected}
          onChange={setSelected}
        />
      </FormScrollView>
      <BottomBar>
        <Button
          size="lg"
          className="bg-brand active:bg-brand/80 rounded-full"
          disabled={save.isPending}
          onPress={submit}>
          <Text className="text-white">Lagre</Text>
        </Button>
      </BottomBar>
    </View>
  );
}
