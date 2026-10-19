import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import type { User } from '@/data/types';

export function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserAvatar({ user, className }: { user: User; className?: string }) {
  return (
    <Avatar alt={user.name} className={className ?? 'size-10'}>
      <AvatarFallback>
        <Text className="text-sm font-medium">{initials(user.name)}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

export function UserRow({
  user,
  subtitle,
  right,
}: {
  user: User;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <UserAvatar user={user} />
      <View className="flex-1">
        <Text className="font-medium">{user.name}</Text>
        {subtitle && <Text className="text-muted-foreground text-sm">{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
