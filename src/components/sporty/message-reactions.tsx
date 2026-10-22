import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { MessageReaction } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Reaksjonene på en melding som én pille med skillestrek mellom hver emoji. Henger over
 * nedre høyre hjørne av boblen. Trykk for å se hvem som har reagert med hva.
 */
export function MessageReactions({
  reactions,
  onPress,
}: {
  reactions: MessageReaction[];
  onPress: () => void;
}) {
  if (reactions.length === 0) return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reaksjoner: ${reactions.map((r) => `${r.emoji} ${r.count}`).join(', ')}`}
      accessibilityHint="Viser hvem som har reagert"
      className="border-border bg-background z-10 -mt-2.5 mr-2 flex-row self-end overflow-hidden rounded-full border shadow-sm shadow-black/10 active:opacity-70">
      {reactions.map((reaction, index) => (
        <View
          key={reaction.emoji}
          className={cn(
            'flex-row items-center gap-1 px-2.5 py-1',
            index > 0 && 'border-border border-l',
            reaction.mine && 'bg-muted'
          )}>
          <Text className="text-sm">{reaction.emoji}</Text>
          <Text className="text-muted-foreground text-sm">{reaction.count}</Text>
        </View>
      ))}
    </Pressable>
  );
}
