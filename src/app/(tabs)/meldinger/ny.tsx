import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useContacts, useStartDirectMessage } from '@/data/hooks';

/** Ny direktemelding: velg en person du deler en gruppe med. */
export default function NyMeldingScreen() {
  const contacts = useContacts();
  const startDirect = useStartDirectMessage();
  const [search, setSearch] = useState('');

  const open = (userId: string) =>
    startDirect.mutate(userId, {
      // Bytt ut denne skjermen med samtalen, så tilbake går rett til samtalelisten.
      onSuccess: ({ id }) => router.replace(`/meldinger/${id}`),
      onError: (error) => Alert.alert('Kunne ikke starte samtalen', error.message),
    });

  return (
    <QueryState query={contacts}>
      {(data) => {
        const q = search.trim().toLowerCase();
        const filtered = data.filter((u) => u.name.toLowerCase().includes(q));
        return (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="px-4 pb-12"
            keyboardShouldPersistTaps="handled"
            data={filtered}
            keyExtractor={(u) => u.id}
            ListHeaderComponent={
              <View className="py-3">
                <Input
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Søk etter navn"
                  autoFocus
                />
              </View>
            }
            ItemSeparatorComponent={() => <Separator />}
            ListEmptyComponent={<EmptyState text="Ingen treff" />}
            renderItem={({ item }) => (
              <Pressable
                disabled={startDirect.isPending}
                onPress={() => open(item.id)}
                className="active:opacity-70">
                <UserRow user={item} subtitle={item.email ?? undefined} />
              </Pressable>
            )}
          />
        );
      }}
    </QueryState>
  );
}
