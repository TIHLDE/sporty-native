import { Link, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';
import { ROLE_LABEL } from '@/lib/roles';

/** Rollene i gruppen. Admin kan endre dem, subadmin kan bare se. */
export default function RollerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);

  return (
    <QueryState query={group}>
      {(data) => {
        // Admin og Index i gruppen eller hovedgruppen (samme som serveren sjekker).
        const isAdmin = data.canAdmin;
        return (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="px-4 pb-12"
            data={data.members}
            keyExtractor={(item) => item.user.id}
            ListHeaderComponent={
              <Text className="text-muted-foreground py-3 text-sm">
                {isAdmin
                  ? 'Trykk på et medlem for å endre rollen.'
                  : 'Bare admin kan endre roller.'}
              </Text>
            }
            ItemSeparatorComponent={() => <Separator />}
            renderItem={({ item }) => {
              const row = (
                <UserRow
                  user={item.user}
                  right={
                    <View className="flex-row items-center gap-2">
                      <Badge
                        variant={
                          item.role === 'member' || item.role === 'index'
                            ? 'outline'
                            : item.role === 'admin'
                              ? 'default'
                              : 'secondary'
                        }>
                        <Text>{ROLE_LABEL[item.role]}</Text>
                      </Badge>
                      {isAdmin && (
                        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
                      )}
                    </View>
                  }
                />
              );
              if (!isAdmin) return row;
              return (
                <Link
                  href={{
                    pathname: '/velg-rolle',
                    params: { groupId: data.id, userId: item.user.id },
                  }}
                  asChild>
                  <Pressable className="active:opacity-70">{row}</Pressable>
                </Link>
              );
            }}
          />
        );
      }}
    </QueryState>
  );
}
