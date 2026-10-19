import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { FlatList, Pressable } from 'react-native';

import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { useUsers } from '@/data/hooks';
import { useSession } from '@/data/session';

/** Kun i utvikling: velg hvilken bruker appen skal late som den er. */
export default function ByttBrukerScreen() {
  const { userId, switchUser } = useSession();
  const users = useUsers();

  return (
    <QueryState query={users}>
      {(data) => (
        <FlatList
          contentContainerClassName="px-4 pb-12"
          data={data}
          keyExtractor={(user) => user.id}
          ItemSeparatorComponent={() => <Separator />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.id !== userId) switchUser(item.id);
                router.back();
              }}
              className="active:opacity-70">
              <UserRow
                user={item}
                subtitle={item.email ?? undefined}
                right={item.id === userId && <Icon as={Check} size={18} className="text-brand" />}
              />
            </Pressable>
          )}
        />
      )}
    </QueryState>
  );
}
