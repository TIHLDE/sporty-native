import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';
import { useSession } from '@/data/session';

/** Steg 3: velg én eller flere brukere som skal få boten. */
export default function VelgBrukereScreen() {
  const { groupId, lawId } = useLocalSearchParams<{ groupId: string; lawId: string }>();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const { userId } = useSession();
  const group = useGroup(groupId);

  const members = (group.data?.members ?? [])
    .map(({ user }) => user)
    .filter((user) => user.id !== userId)
    .filter((user) => user.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (userId: string) =>
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );

  return (
    <View className="flex-1">
      <QueryState query={group}>
        {() => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="px-4 pb-6"
            keyboardShouldPersistTaps="handled"
            data={members}
            keyExtractor={(user) => user.id}
            ListHeaderComponent={
              <View className="py-3">
                <Input value={search} onChangeText={setSearch} placeholder="Søk etter navn" />
              </View>
            }
            ItemSeparatorComponent={() => <Separator />}
            ListEmptyComponent={<EmptyState text="Ingen treff" />}
            renderItem={({ item }) => {
              const checked = selected.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggle(item.id)}
                  className="flex-row items-center gap-3 py-2.5 active:opacity-70">
                  <UserAvatar user={item} />
                  <Text className="flex-1 font-medium">{item.name}</Text>
                  <Checkbox checked={checked} onCheckedChange={() => toggle(item.id)} />
                </Pressable>
              );
            }}
          />
        )}
      </QueryState>
      <BottomBar>
        <Button
          size="lg"
          disabled={selected.length === 0}
          className="rounded-full"
          onPress={() =>
            router.push({
              pathname: '/gi-bot/detaljer',
              params: { groupId, lawId, userIds: selected.join(',') },
            })
          }>
          <Text>
            {selected.length === 0 ? 'Velg minst én' : `Neste (${selected.length} valgt)`}
          </Text>
        </Button>
      </BottomBar>
    </View>
  );
}
