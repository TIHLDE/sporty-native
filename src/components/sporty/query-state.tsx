import type { UseInfiniteQueryResult, UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** Viser lasting eller feil for en spørring, og innholdet når dataene er klare. */
export function QueryState<T>({
  query,
  children,
}: {
  query: UseQueryResult<T> | UseInfiniteQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View className="items-center gap-3 py-10">
        <Text className="text-muted-foreground text-center">{query.error.message}</Text>
        <Button variant="outline" size="sm" onPress={() => query.refetch()}>
          <Text>Prøv igjen</Text>
        </Button>
      </View>
    );
  }
  return <>{children(query.data)}</>;
}
