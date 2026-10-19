import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAddPollComment, usePoll } from '@/data/hooks';
import type { PollDetails } from '@/data/types';
import { formatRelative } from '@/lib/dates';

import { CommentInput, CommentSection } from './comments';
import { FormScrollView } from './form-scroll-view';
import { PollCard } from './poll-card';
import { QueryState } from './query-state';

/** En avstemning med stemming og kommentarer. */
export function PollScreen() {
  const { pollId } = useLocalSearchParams<{ pollId: string }>();
  const poll = usePoll(pollId);
  return <QueryState query={poll}>{(data) => <PollView poll={data} />}</QueryState>;
}

function PollView({ poll }: { poll: PollDetails }) {
  const addComment = useAddPollComment(poll.id);

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: 'Avstemning' }} />
      <FormScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 p-4 pb-8"
        keyboardShouldPersistTaps="handled">
        <Text className="text-muted-foreground text-sm">
          {poll.createdByName ? `${poll.createdByName} · ` : ''}
          {formatRelative(poll.createdAt)}
        </Text>
        <PollCard poll={poll} />
        <CommentSection comments={poll.comments} allowed={poll.allowComments} />
      </FormScrollView>
      {poll.allowComments && <CommentInput mutation={addComment} />}
    </View>
  );
}
