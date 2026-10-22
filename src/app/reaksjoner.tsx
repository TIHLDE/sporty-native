import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { UserAvatar } from '@/components/sporty/user-row';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useMe, useMessages, useReactToMessage } from '@/data/hooks';
import type { User } from '@/data/types';

/**
 * Hvem som har reagert på en melding, og med hva. Egne reaksjoner kan fjernes herfra.
 * Åpnes ved å trykke på reaksjonene under en melding.
 */
export default function ReaksjonerScreen() {
  const { conversationId, messageId } = useLocalSearchParams<{
    conversationId: string;
    messageId: string;
  }>();
  const me = useMe().data;
  // Meldingen ligger allerede i samtalens cache, og oppdateres sammen med den.
  const message = useMessages(conversationId)
    .data?.pages.flatMap((p) => p.messages)
    .find((m) => m.id === messageId);

  // Én rad per person med alle emojiene deres, i rekkefølgen de først reagerte.
  const people = new Map<string, { user: User; emojis: string[] }>();
  for (const reaction of message?.reactions ?? []) {
    for (const user of reaction.users) {
      const person = people.get(user.id) ?? { user, emojis: [] };
      person.emojis.push(reaction.emoji);
      people.set(user.id, person);
    }
  }
  // Deg først, så de andre.
  const rows = [...people.values()].sort(
    (a, b) => Number(b.user.id === me?.id) - Number(a.user.id === me?.id)
  );

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4">Reaksjoner</Text>
      {rows.length === 0 ? (
        <Text className="text-muted-foreground py-4 text-sm">Ingen reaksjoner.</Text>
      ) : (
        <ScrollView className="max-h-[480px]">
          {rows.map(({ user, emojis }, index) => (
            <View key={user.id}>
              {index > 0 && <Separator />}
              {me && user.id === me.id ? (
                <MyRow
                  me={me}
                  emojis={emojis}
                  conversationId={conversationId}
                  messageId={messageId}
                />
              ) : (
                <View className="flex-row items-center gap-3 py-3">
                  <UserAvatar user={user} className="size-9" />
                  <Text className="flex-1 font-medium" numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Text className="text-xl">{emojis.join(' ')}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function MyRow({
  me,
  emojis,
  conversationId,
  messageId,
}: {
  me: User;
  emojis: string[];
  conversationId: string;
  messageId: string;
}) {
  const { mutate: react } = useReactToMessage(conversationId, me);

  return (
    <View className="flex-row items-center gap-3 py-3">
      <UserAvatar user={me} className="size-9" />
      <View className="flex-1">
        <Text className="font-medium">Deg</Text>
        <Text className="text-muted-foreground text-xs">Trykk på en emoji for å fjerne den</Text>
      </View>
      <View className="flex-row gap-1">
        {emojis.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => react({ messageId, emoji })}
            accessibilityLabel={`Fjern ${emoji}`}
            className="bg-muted size-9 items-center justify-center rounded-full active:opacity-60">
            <Text className="text-xl">{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
