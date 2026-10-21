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
import { useGroup, useMatchStatTypeMutations } from '@/data/hooks';
import type { GroupDetails, MatchStatType } from '@/data/types';

/**
 * (Admin i hovedgruppen) Hendelsene i kampfakta, f.eks. Mål og Gult kort: legg til, gi nytt navn,
 * flytt og slett. Gjelder også undergruppene. Rekkefølgen her er rekkefølgen på kampene.
 */
export default function KampfaktaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  return <QueryState query={group}>{(data) => <Types group={data} />}</QueryState>;
}

function Types({ group }: { group: GroupDetails }) {
  const mutations = useMatchStatTypeMutations(group.id);
  const types = group.matchFacts.types;
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

  const remove = (type: MatchStatType) => {
    Alert.alert(
      `Slette ${type.name}?`,
      `Alle hendelser av typen «${type.name}» som er registrert på kamper, slettes også.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => mutations.remove.mutate(type.id, { onError }),
        },
      ]
    );
  };

  return (
    <FormScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      {!group.matchFacts.enabled && (
        <Text className="text-muted-foreground text-sm">
          Kampfakta er skrudd av. Slå det på under Innstillinger for å vise det på kampene.
        </Text>
      )}

      <View className="bg-muted/60 rounded-2xl px-4">
        {types.length === 0 && (
          <Text className="text-muted-foreground py-4 text-center">Ingen hendelser ennå</Text>
        )}
        {types.map((type, index) => (
          <View key={type.id}>
            {index > 0 && <Separator />}
            {editing?.id === type.id ? (
              <View className="flex-row items-center gap-2 py-2">
                <Input
                  className="flex-1"
                  value={editing.name}
                  onChangeText={(name) => setEditing({ id: type.id, name })}
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
                <Text className="flex-1 font-medium">{type.name}</Text>
                <IconButton
                  icon={ArrowUp}
                  label={`Flytt ${type.name} opp`}
                  disabled={busy || index === 0}
                  onPress={() =>
                    mutations.move.mutate({ id: type.id, move: 'up' }, { onError })
                  }
                />
                <IconButton
                  icon={ArrowDown}
                  label={`Flytt ${type.name} ned`}
                  disabled={busy || index === types.length - 1}
                  onPress={() =>
                    mutations.move.mutate({ id: type.id, move: 'down' }, { onError })
                  }
                />
                <IconButton
                  icon={Pencil}
                  label={`Gi ${type.name} nytt navn`}
                  disabled={busy}
                  onPress={() => setEditing({ id: type.id, name: type.name })}
                />
                <IconButton
                  icon={Trash2}
                  label={`Slett ${type.name}`}
                  destructive
                  disabled={busy}
                  onPress={() => remove(type)}
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
          placeholder="Ny hendelse, f.eks. Redning"
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
