import { router, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import emojiData from '@/data/emojis.json';
import { useMe, useReactToMessage } from '@/data/hooks';
import type { User } from '@/data/types';

/** Bredden og høyden på hver emoji i rutenettet. */
const CELL = 44;

type Row = { key: string; header: string } | { key: string; emojis: string[] };

/** Del en liste med emojier opp i rader som passer bredden. */
function toRows(key: string, emojis: string[], columns: number): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < emojis.length; i += columns) {
    rows.push({ key: `${key}-${i}`, emojis: emojis.slice(i, i + columns) });
  }
  return rows;
}

/** Velg hvilken som helst emoji å reagere med. Søk på norsk, f.eks. «tommel» eller «hjerte». */
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
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const columns = Math.max(6, Math.floor((width - 24) / CELL));
  const searching = query.trim().length > 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hits = emojiData.groups.flatMap((g) =>
        g.emojis.filter(([, text]) => text.includes(q)).map(([emoji]) => emoji)
      );
      return toRows('search', hits, columns);
    }
    return emojiData.groups.flatMap((g) => [
      { key: g.label, header: g.label },
      ...toRows(
        g.label,
        g.emojis.map(([emoji]) => emoji),
        columns
      ),
    ]);
  }, [query, columns]);

  const choose = (emoji: string) => {
    react({ messageId, emoji });
    router.back();
  };

  return (
    <>
      <View className="justify-center px-4 pb-2 pt-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Søk etter emoji"
          autoCorrect={false}
          className="rounded-full pl-9"
        />
        <View className="absolute left-7 top-3 h-10 justify-center" pointerEvents="none">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName="px-3 pb-8"
        initialNumToRender={20}
        ListEmptyComponent={
          searching ? (
            <Text className="text-muted-foreground py-6 text-center text-sm">
              Fant ingen emoji for «{query.trim()}»
            </Text>
          ) : null
        }
        renderItem={({ item }) =>
          'header' in item ? (
            <Text className="text-muted-foreground px-1 pb-1 pt-4 text-xs font-medium">
              {item.header}
            </Text>
          ) : (
            <View className="flex-row">
              {item.emojis.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => choose(emoji)}
                  accessibilityLabel={emoji}
                  style={{ width: CELL, height: CELL }}
                  className="active:bg-muted items-center justify-center rounded-lg">
                  <Text className="text-[28px] leading-9">{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )
        }
      />
    </>
  );
}
