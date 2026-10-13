import { router, type Href } from 'expo-router';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CircleDollarSign,
  Megaphone,
  UserCheck,
  Wallet,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMarkNotificationRead } from '@/data/hooks';
import type { Notification, NotificationType } from '@/data/types';
import { formatRelative } from '@/lib/dates';
import { cn } from '@/lib/utils';

const ICONS: Record<NotificationType, typeof Bell> = {
  event: CalendarDays,
  attendance: UserCheck,
  fine: CircleDollarSign,
  announcement: Megaphone,
  poll: BarChart3,
  payment: Wallet,
};

export function NotificationRow({ notification }: { notification: Notification }) {
  const { href } = notification;
  const markRead = useMarkNotificationRead();

  const open = () => {
    if (!notification.read) markRead.mutate(notification.id);
    if (href) router.push(href as Href);
  };

  return (
    <Pressable
      onPress={open}
      className="flex-row items-center gap-3 py-3 active:opacity-70">
      <View className="bg-muted size-10 items-center justify-center rounded-full">
        <Icon as={ICONS[notification.type]} size={18} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={cn(!notification.read && 'font-semibold')}>{notification.text}</Text>
        <Text className="text-muted-foreground text-xs">{formatRelative(notification.createdAt)}</Text>
      </View>
      {!notification.read && <View className="bg-brand size-2.5 rounded-full" />}
    </Pressable>
  );
}
