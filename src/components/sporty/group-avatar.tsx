import { Image } from 'expo-image';
import { Shield } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface GroupAvatarProps {
  group: { color: string; logoUrl?: string | null };
  size?: number;
  className?: string;
}

/** Rund gruppelogo: logoen fra tihlde.org hvis gruppen har en, ellers gruppefargen med et skjold. */
export function GroupAvatar({ group, size = 40, className }: GroupAvatarProps) {
  return (
    <View
      className={cn('items-center justify-center overflow-hidden rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: group.color }}>
      {group.logoUrl ? (
        <Image
          source={{ uri: group.logoUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Icon as={Shield} size={size * 0.5} className="text-white" fill="rgba(255,255,255,0.25)" />
      )}
    </View>
  );
}
