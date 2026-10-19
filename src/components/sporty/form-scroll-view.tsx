import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

// Lar NativeWind-klasser virke på scroll-viewet, som på React Natives egen ScrollView.
cssInterop(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

/** Plass til BottomBar over tastaturet, så feltet man skriver i ikke havner bak knappen. */
const BOTTOM_BAR_SPACE = 96;

type FormScrollViewProps = ComponentProps<typeof KeyboardAwareScrollView> & {
  className?: string;
  contentContainerClassName?: string;
};

/**
 * Scroll-view for skjermer med tekstfelt og BottomBar. Scroller feltet man skriver i opp over
 * tastaturet og bunnlinjen.
 */
export function FormScrollView(props: FormScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={BOTTOM_BAR_SPACE}
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
}
