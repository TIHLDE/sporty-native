import { Link, useLocalSearchParams } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { FlatList, Pressable, View } from "react-native";

import { EmptyState } from "@/components/sporty/empty-state";
import { QueryState } from "@/components/sporty/query-state";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useGroup, useLaws } from "@/data/hooks";
import { formatLaw } from "@/lib/fines";

/** Steg 2: velg hvilken lov (paragraf) som er brutt. */
export default function VelgLovScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  const laws = useLaws(groupId);

  return (
    <QueryState query={laws}>
      {(data) => (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-4 pb-12"
          data={data}
          keyExtractor={(law) => law.id}
          ListHeaderComponent={
            group.data && (
              <Text className="text-muted-foreground py-3 text-sm">
                Botregler for {group.data.name}
              </Text>
            )
          }
          ItemSeparatorComponent={() => <Separator />}
          ListEmptyComponent={
            <EmptyState text="Gruppen har ingen botregler ennå" />
          }
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: "/gi-bot/brukere",
                params: { groupId, lawId: item.id },
              }}
              asChild
            >
              <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
                <View className="flex-1 gap-0.5">
                  <Text className="font-semibold">{formatLaw(item)}</Text>
                  <Text className="text-muted-foreground text-sm">
                    {item.description}
                  </Text>
                </View>
                <Icon
                  as={ChevronRight}
                  size={18}
                  className="text-muted-foreground"
                />
              </Pressable>
            </Link>
          )}
        />
      )}
    </QueryState>
  );
}
