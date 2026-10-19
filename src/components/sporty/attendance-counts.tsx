import { CircleCheck, CircleHelp, CircleX } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** ✓ kommer · ? ikke svart · ✗ kommer ikke */
export function AttendanceCounts({
  kommer,
  ubesvart,
  kommerIkke,
}: {
  kommer: number;
  ubesvart: number;
  kommerIkke: number;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Count icon={CircleCheck} value={kommer} className="text-green-500" />
      <Count icon={CircleHelp} value={ubesvart} className="text-amber-500" />
      <Count icon={CircleX} value={kommerIkke} className="text-red-500" />
    </View>
  );
}

function Count({
  icon,
  value,
  className,
}: {
  icon: typeof CircleCheck;
  value: number;
  className: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon as={icon} size={14} className={className} />
      <Text className={`text-sm ${className}`}>{value}</Text>
    </View>
  );
}
