import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Fast knapperad nederst på skjermen, f.eks. "Neste" eller "Gi bot". Følger tastaturet opp,
 * også i modaler (der React Natives KeyboardAvoidingView regner feil på iOS).
 */
export function BottomBar({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 12);

  return (
    // Over tastaturet trengs ikke avstanden til hjemlinjen, så den trekkes fra.
    <KeyboardStickyView offset={{ closed: 0, opened: paddingBottom - 12 }}>
      <View className="border-border bg-background border-t px-4 pt-3" style={{ paddingBottom }}>
        {children}
      </View>
    </KeyboardStickyView>
  );
}
