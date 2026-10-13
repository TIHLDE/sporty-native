import { Shield } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface GroupAvatarProps {
  group: { color: string };
  size?: number;
  className?: string;
}

/** Rund gruppelogo. Bruker gruppefargen og et skjold til ekte logoer er på plass. */
export function GroupAvatar({ group, size = 40, className }: GroupAvatarProps) {
  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: group.color }}>
      <Icon as={Shield} size={size * 0.5} className="text-white" fill="rgba(255,255,255,0.25)" />
    </View>
  );
}
