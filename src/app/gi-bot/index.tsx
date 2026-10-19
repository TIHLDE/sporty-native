import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupAvatar } from '@/components/sporty/group-avatar';
import { QueryState } from '@/components/sporty/query-state';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useManagedGroups } from '@/data/hooks';

/** Steg 1: velg gruppe. */
export default function VelgGruppeScreen() {
  const groups = useManagedGroups();

  return (
    <QueryState query={groups}>
      {(data) => (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-4 pb-12"
          data={data}
          keyExtractor={(group) => group.id}
          ItemSeparatorComponent={() => <Separator />}
          ListEmptyComponent={<EmptyState text="Du kan ikke gi bøter i noen grupper" />}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/gi-bot/lov', params: { groupId: item.id } }} asChild>
              <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
                <GroupAvatar group={item} size={40} />
                <Text className="flex-1 font-medium">{item.name}</Text>
                <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
              </Pressable>
            </Link>
          )}
        />
      )}
    </QueryState>
  );
}
