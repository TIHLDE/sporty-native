import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react-native';
import { Modal, Pressable } from 'react-native';
import Animated, { FadeIn, ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { REACTION_EMOJIS } from '@/lib/messages';
import { cn } from '@/lib/utils';

export interface MessageMenuAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * Menyen som kommer opp når man holder inne en melding: meldingen løftes fram over en dempet
 * bakgrunn, med emoji-reaksjoner over og valgene under. Trykk utenfor for å lukke.
 */
export function MessageMenu({
  visible,
  onClose,
  alignEnd,
  preview,
  actions,
  myReactions,
  onReact,
  onMoreReactions,
}: {
  visible: boolean;
  onClose: () => void;
  /** Egne meldinger står til høyre, så menyen gjør det også. */
  alignEnd: boolean;
  preview: ReactNode;
  actions: MessageMenuAction[];
  /** Emojiene brukeren allerede har reagert med. Uten `onReact` vises ingen emoji-rad. */
  myReactions: string[];
  onReact?: (emoji: string) => void;
  /** Åpner velgeren med alle emojiene. */
  onMoreReactions?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Lukk"
        className={cn(
          'flex-1 justify-center gap-2 bg-black/50 px-3',
          alignEnd ? 'items-end' : 'items-start'
        )}>
        {onReact && (
          <Animated.View
            entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
            className="bg-card flex-row gap-1 rounded-full p-1.5">
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  onClose();
                  onReact(emoji);
                }}
                accessibilityLabel={`Reager med ${emoji}`}
                className={cn(
                  'size-10 items-center justify-center rounded-full active:opacity-60',
                  myReactions.includes(emoji) && 'bg-muted'
                )}>
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            ))}
            {onMoreReactions && (
              <Pressable
                onPress={() => {
                  onClose();
                  onMoreReactions();
                }}
                accessibilityLabel="Flere emojier"
                className="bg-muted size-10 items-center justify-center rounded-full active:opacity-60">
                <Icon as={Plus} size={20} className="text-muted-foreground" />
              </Pressable>
            )}
          </Animated.View>
        )}
        <Animated.View
          entering={ZoomIn.duration(180).reduceMotion(ReduceMotion.System)}
          className={cn('max-w-[78%]', alignEnd ? 'items-end' : 'items-start')}>
          {preview}
        </Animated.View>
        {actions.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(180).delay(60).reduceMotion(ReduceMotion.System)}
            className="bg-card w-56 overflow-hidden rounded-2xl">
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                className={cn(
                  'active:bg-muted flex-row items-center justify-between px-4 py-3',
                  index > 0 && 'border-border border-t'
                )}>
                <Text className={cn('text-[15px]', action.destructive && 'text-destructive')}>
                  {action.label}
                </Text>
                <Icon
                  as={action.icon}
                  size={18}
                  className={action.destructive ? 'text-destructive' : 'text-foreground'}
                />
              </Pressable>
            ))}
          </Animated.View>
        )}
      </Pressable>
    </Modal>
  );
}
