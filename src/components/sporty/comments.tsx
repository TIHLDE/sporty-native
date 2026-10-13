import type { UseMutationResult } from '@tanstack/react-query';
import { MessageCircleOff, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { Comment } from '@/data/types';
import { formatRelative } from '@/lib/dates';

import { BottomBar } from './bottom-bar';
import { UserAvatar } from './user-row';

/** Kommentarlisten under en kunngjøring eller avstemning. */
export function CommentSection({ comments, allowed }: { comments: Comment[]; allowed: boolean }) {
  return (
    <View className="gap-3">
      <Text variant="h4">Kommentarer</Text>
      {!allowed ? (
        <View className="flex-row items-center gap-2">
          <Icon as={MessageCircleOff} size={16} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-sm">Kommentarer er slått av</Text>
        </View>
      ) : comments.length === 0 ? (
        <Text className="text-muted-foreground text-sm">Ingen kommentarer ennå</Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} className="flex-row gap-3">
            <UserAvatar user={comment.author} className="size-8" />
            <View className="bg-muted/60 flex-1 gap-0.5 rounded-2xl px-3 py-2">
              <Text className="text-sm font-semibold">
                {comment.author.name}{' '}
                <Text className="text-muted-foreground text-xs font-normal">
                  {formatRelative(comment.createdAt)}
                </Text>
              </Text>
              <Text className="text-sm leading-5">{comment.body}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

/** Fast kommentarfelt nederst på skjermen. Tar mutasjonen som sender kommentaren. */
export function CommentInput({
  mutation,
}: {
  mutation: UseMutationResult<unknown, Error, string>;
}) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !mutation.isPending;

  const send = () =>
    mutation.mutate(text.trim(), {
      onSuccess: () => setText(''),
      onError: (error) => Alert.alert('Kunne ikke kommentere', error.message),
    });

  return (
    <BottomBar>
      <View className="flex-row items-center gap-2">
        <Input
          className="flex-1 rounded-full"
          value={text}
          onChangeText={setText}
          placeholder="Skriv en kommentar"
          returnKeyType="send"
          onSubmitEditing={() => canSend && send()}
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          hitSlop={8}
          className="bg-brand size-10 items-center justify-center rounded-full active:opacity-70 disabled:opacity-40">
          <Icon as={Send} size={18} className="text-white" />
        </Pressable>
      </View>
    </BottomBar>
  );
}
