import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAddComment, useAnnouncement } from '@/data/hooks';
import type { AnnouncementDetails } from '@/data/types';
import { formatRelative } from '@/lib/dates';

import { CommentInput, CommentSection } from './comments';
import { FormScrollView } from './form-scroll-view';
import { GroupAvatar } from './group-avatar';
import { AttachmentList, MediaGallery } from './media';
import { QueryState } from './query-state';

/** En kunngjøring med bilder/video, vedlegg og kommentarer. Brukes av både Hjem og Grupper. */
export function AnnouncementScreen() {
  const { announcementId } = useLocalSearchParams<{ announcementId: string }>();
  const announcement = useAnnouncement(announcementId);
  return (
    <QueryState query={announcement}>
      {(data) => <AnnouncementView announcement={data} />}
    </QueryState>
  );
}

function AnnouncementView({ announcement }: { announcement: AnnouncementDetails }) {
  const addComment = useAddComment(announcement.id);

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: announcement.title }} />
      <FormScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-2">
          <GroupAvatar group={{ color: announcement.groupColor }} size={28} />
          <Text className="text-muted-foreground flex-1 text-sm">
            {announcement.groupName} · {announcement.authorName} ·{' '}
            {formatRelative(announcement.createdAt)}
          </Text>
        </View>

        <Text variant="h3">{announcement.title}</Text>
        {announcement.body ? <Text className="leading-6">{announcement.body}</Text> : null}

        {announcement.media.length > 0 && <MediaGallery media={announcement.media} />}
        {announcement.attachments.length > 0 && (
          <View className="gap-2">
            <Text className="text-muted-foreground text-sm font-medium">Vedlegg</Text>
            <AttachmentList attachments={announcement.attachments} />
          </View>
        )}

        <CommentSection comments={announcement.comments} allowed={announcement.allowComments} />
      </FormScrollView>

      {announcement.allowComments && <CommentInput mutation={addComment} />}
    </View>
  );
}
