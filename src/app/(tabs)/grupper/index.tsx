import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupTile } from '@/components/sporty/group-tile';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { useMe, useMyGroups } from '@/data/hooks';

// Grupper opprettes og administreres på nettsiden. I appen ser man bare gruppene man er med i.
export default function GrupperScreen() {
  const me = useMe();
  const groups = useMyGroups();

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () =>
            me.data && (
              <Link href="/profil" asChild>
                <Pressable>
                  <UserAvatar user={me.data} className="size-8" />
                </Pressable>
              </Link>
            ),
        }}
      />
      <QueryState query={groups}>
        {(data) => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="gap-4 p-4 pb-12"
            columnWrapperClassName="gap-4"
            numColumns={2}
            data={data}
            keyExtractor={(group) => group.id}
            renderItem={({ item }) => <GroupTile group={item} />}
            ListEmptyComponent={<EmptyState text="Du er ikke med i noen grupper ennå" />}
            refreshControl={<RefreshControl refreshing={groups.isRefetching} onRefresh={groups.refetch} />}
          />
        )}
      </QueryState>
    </>
  );
}
