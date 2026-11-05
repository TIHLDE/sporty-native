import { Alert, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useBlockedUsers, useUnblockUser } from '@/data/moderation';

/** Personene brukeren har blokkert. */
export default function BlokkerteScreen() {
  const blocked = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-3 p-4 pb-16">
      <Text className="text-muted-foreground text-sm">
        Du ser ikke meldingene til personer du har blokkert, og dere kan ikke sende direktemeldinger
        til hverandre.
      </Text>
      <QueryState query={blocked}>
        {(data) =>
          data.length === 0 ? (
            <EmptyState text="Du har ikke blokkert noen" />
          ) : (
            <View>
              {data.map((user, index) => (
                <View key={user.id}>
                  {index > 0 && <Separator />}
                  <UserRow
                    user={user}
                    right={
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={unblock.isPending}
                        onPress={() =>
                          unblock.mutate(user.id, {
                            onError: (error) =>
                              Alert.alert('Blokkeringen ble ikke opphevet', error.message),
                          })
                        }>
                        <Text>Opphev</Text>
                      </Button>
                    }
                  />
                </View>
              ))}
            </View>
          )
        }
      </QueryState>
    </ScrollView>
  );
}
