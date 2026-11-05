import { ChevronDown } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';

/** Myk inn og ut uten å sprette, samme kurve som høydeendringene på nettsiden (Animate UI). */
const TIMING = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.1, 1),
  reduceMotion: ReduceMotion.System,
};

function useOpenProgress(open: boolean) {
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(open ? 1 : 0, TIMING));
  }, [open, progress]);

  return progress;
}

/**
 * Innhold som foldes ut og inn. Innholdet måles i en absolutt plassert visning, så høyden er kjent
 * også mens det er lukket.
 */
export function AccordionContent({ open, children }: { open: boolean; children: ReactNode }) {
  const progress = useOpenProgress(open);
  const contentHeight = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    height: contentHeight.get() * progress.get(),
    opacity: progress.get(),
  }));

  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View
        // Skjult for skjermlesere og trykk mens det er lukket.
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'auto' : 'none'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        onLayout={(event) => contentHeight.set(event.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

/** Pil som snur seg i takt med at innholdet åpnes. */
export function AccordionChevron({ open }: { open: boolean }) {
  const progress = useOpenProgress(open);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Icon as={ChevronDown} size={18} className="text-muted-foreground" />
    </Animated.View>
  );
}
