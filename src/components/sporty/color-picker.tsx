import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { GROUP_COLORS } from '@/lib/group-colors';

/** Velg en av gruppefargene. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {GROUP_COLORS.map((color) => (
        <Pressable
          key={color}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === color }}
          accessibilityLabel={`Farge ${color}`}
          onPress={() => onChange(color)}
          className="size-11 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: color }}>
          {value === color && <Icon as={Check} size={20} className="text-white" />}
        </Pressable>
      ))}
    </View>
  );
}
