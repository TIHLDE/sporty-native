import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { UserAvatar } from '@/components/sporty/user-row';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { User } from '@/data/types';

/**
 * Avkrysningsliste over medlemmer med søk. Lager vanlige rader (ikke FlatList), så den kan stå
 * inni et skjema som scroller. Lagene er små nok til det.
 */
export function MemberPicker({
  users,
  selected,
  onChange,
}: {
  users: User[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visible = [...users]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((user) => user.name.toLowerCase().includes(query));

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  const allSelected = users.length > 0 && users.every((u) => selected.includes(u.id));

  return (
    <View className="gap-3">
      <Input value={search} onChangeText={setSearch} placeholder="Søk etter navn" />
      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground text-sm">
          {selected.length} av {users.length} valgt
        </Text>
        <Pressable hitSlop={8} onPress={() => onChange(allSelected ? [] : users.map((u) => u.id))}>
          <Text className="text-brand text-sm font-medium">
            {allSelected ? 'Fjern alle' : 'Velg alle'}
          </Text>
        </Pressable>
      </View>
      <View className="bg-muted/60 rounded-2xl px-4">
        {visible.length === 0 && (
          <Text className="text-muted-foreground py-4 text-center">Ingen treff</Text>
        )}
        {visible.map((user, index) => (
          <View key={user.id}>
            {index > 0 && <Separator />}
            <Pressable
              onPress={() => toggle(user.id)}
              className="flex-row items-center gap-3 py-2.5 active:opacity-70">
              <UserAvatar user={user} />
              <Text className="flex-1 font-medium">{user.name}</Text>
              <Checkbox
                checked={selected.includes(user.id)}
                onCheckedChange={() => toggle(user.id)}
              />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
