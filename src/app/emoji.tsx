import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { EmojiGrid } from '@/components/sporty/emoji-grid';
import { Text } from '@/components/ui/text';
import { useMe, useReactToMessage } from '@/data/hooks';
import type { User } from '@/data/types';

/** Velg hvilken som helst emoji å reagere med. */
export default function EmojiScreen() {
  const { conversationId, messageId } = useLocalSearchParams<{
    conversationId: string;
    messageId: string;
  }>();
  const me = useMe().data;

  return (
    <View className="flex-1 pt-6">
      <Text variant="h4" className="px-4">
        Reager med emoji
      </Text>
      {me ? (
        <Picker conversationId={conversationId} messageId={messageId} me={me} />
      ) : (
        <ActivityIndicator className="py-10" />
      )}
    </View>
  );
}

function Picker({
  conversationId,
  messageId,
  me,
}: {
  conversationId: string;
  messageId: string;
  me: User;
}) {
  const { mutate: react } = useReactToMessage(conversationId, me);

  return (
    <EmojiGrid
      onSelect={(emoji) => {
        react({ messageId, emoji });
        router.back();
      }}
    />
  );
}
