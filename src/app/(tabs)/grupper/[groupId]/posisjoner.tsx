import { useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup, usePositionMutations } from '@/data/hooks';
import type { GroupDetails, GroupPosition } from '@/data/types';

/**
 * (Admin) Gruppens posisjonsliste: legg til, gi nytt navn, flytt og slett. Rekkefølgen her er
 * rekkefølgen på Medlemmer-siden.
 */
export default function PosisjonerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(data) => <Positions group={data} />}</QueryState>;
}

function Positions({ group }: { group: GroupDetails }) {
  const mutations = usePositionMutations(group.id);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const busy = Object.values(mutations).some((m) => m.isPending);
  const onError = (error: Error) => Alert.alert('Kunne ikke lagre', error.message);

  const add = () =>
    mutations.create.mutate(newName.trim(), { onSuccess: () => setNewName(''), onError });

  const saveEdit = () => {
    if (!editing) return;
    mutations.rename.mutate(
      { id: editing.id, name: editing.name.trim() },
      { onSuccess: () => setEditing(null), onError }
    );
  };

  const remove = (position: GroupPosition) => {
    const count = group.members.filter((m) => m.position?.id === position.id).length;
    Alert.alert(
      `Slette ${position.name}?`,
      count > 0
        ? `${count} ${count === 1 ? 'spiller har' : 'spillere har'} denne posisjonen og står uten posisjon etterpå.`
        : undefined,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => mutations.remove.mutate(position.id, { onError }),
        },
      ]
    );
  };

  return (
    <FormScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      {!group.usesPositions && (
        <Text className="text-muted-foreground text-sm">
          Gruppen bruker ikke posisjoner. Slå det på under Innstillinger for å vise dem.
        </Text>
      )}

      <View className="bg-muted/60 rounded-2xl px-4">
        {group.positions.length === 0 && (
          <Text className="text-muted-foreground py-4 text-center">Ingen posisjoner ennå</Text>
        )}
        {group.positions.map((position, index) => (
          <View key={position.id}>
            {index > 0 && <Separator />}
            {editing?.id === position.id ? (
              <View className="flex-row items-center gap-2 py-2">
                <Input
                  className="flex-1"
                  value={editing.name}
                  onChangeText={(name) => setEditing({ id: position.id, name })}
                  onSubmitEditing={saveEdit}
                  autoFocus
                  maxLength={40}
                />
                <Button size="sm" disabled={!editing.name.trim() || busy} onPress={saveEdit}>
                  <Text>Lagre</Text>
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setEditing(null)}>
                  <Text>Avbryt</Text>
                </Button>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 py-2">
                <Text className="flex-1 font-medium">{position.name}</Text>
                <IconButton
                  icon={ArrowUp}
                  label={`Flytt ${position.name} opp`}
                  disabled={busy || index === 0}
                  onPress={() =>
                    mutations.move.mutate({ id: position.id, move: 'up' }, { onError })
                  }
                />
                <IconButton
                  icon={ArrowDown}
                  label={`Flytt ${position.name} ned`}
                  disabled={busy || index === group.positions.length - 1}
                  onPress={() =>
                    mutations.move.mutate({ id: position.id, move: 'down' }, { onError })
                  }
                />
                <IconButton
                  icon={Pencil}
                  label={`Gi ${position.name} nytt navn`}
                  disabled={busy}
                  onPress={() => setEditing({ id: position.id, name: position.name })}
                />
                <IconButton
                  icon={Trash2}
                  label={`Slett ${position.name}`}
                  destructive
                  disabled={busy}
                  onPress={() => remove(position)}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="flex-row gap-2">
        <Input
          className="flex-1"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={() => newName.trim() && add()}
          placeholder="Ny posisjon, f.eks. Keeper"
          maxLength={40}
        />
        <Button
          className="bg-brand active:bg-brand/80"
          disabled={!newName.trim() || busy}
          onPress={add}>
          <Text className="text-white">Legg til</Text>
        </Button>
      </View>
    </FormScrollView>
  );
}

function IconButton({
  icon,
  label,
  destructive,
  disabled,
  onPress,
}: {
  icon: typeof Pencil;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      disabled={disabled}
      onPress={onPress}
      className="p-2 active:opacity-60"
      style={{ opacity: disabled ? 0.3 : 1 }}>
      <Icon as={icon} size={18} className={destructive ? 'text-destructive' : undefined} />
    </Pressable>
  );
}
