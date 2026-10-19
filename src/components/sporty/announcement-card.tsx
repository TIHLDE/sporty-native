import { Link, useSegments } from 'expo-router';
import { MessageCircle, Paperclip } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Announcement } from '@/data/types';
import { formatRelative } from '@/lib/dates';

import { GroupAvatar } from './group-avatar';
import { MediaPreview } from './media';

export function AnnouncementCard({
  announcement,
  showGroup = false,
}: {
  announcement: Announcement;
  showGroup?: boolean;
}) {
  // Åpne kunngjøringen i fanen man står i, så den skyves inn der.
  const inHomeTab = (useSegments() as string[]).includes('(hjem)');
  const href = inHomeTab
    ? (`/kunngjoring/${announcement.id}` as const)
    : (`/grupper/${announcement.groupId}/kunngjoring/${announcement.id}` as const);

  return (
    <Link href={href} asChild>
      <Pressable className="bg-muted/60 gap-2 rounded-2xl p-4 active:opacity-70">
        <View className="flex-row items-center gap-2">
          {showGroup && <GroupAvatar group={{ color: announcement.groupColor }} size={24} />}
          <Text className="text-muted-foreground flex-1 text-sm" numberOfLines={1}>
            {showGroup ? `${announcement.groupName} · ` : ''}
            {announcement.authorName} · {formatRelative(announcement.createdAt)}
          </Text>
        </View>
        <Text className="font-semibold">{announcement.title}</Text>
        {announcement.body ? (
          <Text className="text-sm leading-5" numberOfLines={4}>
            {announcement.body}
          </Text>
        ) : null}
        <MediaPreview media={announcement.media} />
        {(announcement.attachments.length > 0 || announcement.allowComments) && (
          <View className="flex-row items-center gap-4 pt-1">
            {announcement.attachments.length > 0 && (
              <Meta icon={Paperclip} text={`${announcement.attachments.length} vedlegg`} />
            )}
            {announcement.allowComments && (
              <Meta icon={MessageCircle} text={`${announcement.commentCount} kommentarer`} />
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function Meta({ icon, text }: { icon: typeof Paperclip; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon as={icon} size={14} className="text-muted-foreground" />
      <Text className="text-muted-foreground text-xs">{text}</Text>
    </View>
  );
}
