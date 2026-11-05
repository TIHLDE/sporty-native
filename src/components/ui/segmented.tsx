import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { TabLabel, useTabIndicator } from "@/components/ui/tabs";

/** Pille-velger der markeringen glir mellom valgene. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [layouts, setLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const pillStyle = useTabIndicator(layouts[value]);

  if (options.length < 2) return null;
  return (
    <View className="bg-muted/60 flex-row gap-1 rounded-full p-1">
      <Animated.View
        pointerEvents="none"
        className="bg-muted absolute bottom-1 left-0 top-1 rounded-full"
        style={pillStyle}
      />
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            setLayouts((current) => ({ ...current, [o.value]: { x, width } }));
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          className="h-9 flex-1 items-center justify-center rounded-full"
        >
          <TabLabel active={o.value === value}>{o.label}</TabLabel>
        </Pressable>
      ))}
    </View>
  );
}
