import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  View,
  type ScrollViewProps,
} from 'react-native';
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar } from '@/components/sporty/bottom-bar';
import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import {
  useConversation,
  useMarkConversationRead,
  useMe,
  useMessages,
  useSendMessage,
} from '@/data/hooks';
import type { ConversationDetails, Message, User } from '@/data/types';
import { formatTime } from '@/lib/dates';
import { setOpenScreen } from '@/lib/notifications';
import { cn } from '@/lib/utils';

/** Meldinger fra samme person innenfor dette vinduet slås sammen (navn og bilde vises én gang). */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const dayLabel = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'I dag';
  if (date.toDateString() === yesterday.toDateString()) return 'I går';
  return dayLabel.format(date);
}

export default function SamtaleScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const conversation = useConversation(conversationId);
  const me = useMe();

  return (
    <QueryState query={conversation}>
      {(details) =>
        me.data ? (
          <Chat conversation={details} me={me.data} />
        ) : (
          <ActivityIndicator className="py-10" />
        )
      }
    </QueryState>
  );
}

function Chat({ conversation, me }: { conversation: ConversationDetails; me: User }) {
  const insets = useSafeAreaInsets();
  const messages = useMessages(conversation.id);
  const markRead = useMarkConversationRead(conversation.id);
  const isGroup = conversation.group !== null;

  const all = messages.data?.pages.flatMap((p) => p.messages) ?? [];
  const newestId = all[0]?.id;

  // Marker som lest når samtalen åpnes og hver gang det kommer en ny melding.
  const { mutate: markReadMutate } = markRead;
  useEffect(() => {
    if (newestId) markReadMutate();
  }, [newestId, markReadMutate]);

  // Ikke vis varsler om nye meldinger i samtalen mens man ser på den. De kommer inn i listen.
  useFocusEffect(
    useCallback(() => {
      setOpenScreen(`/meldinger/${conversation.id}`);
      return () => setOpenScreen(null);
    }, [conversation.id])
  );

  // Avstanden mellom listen og bunnen av skjermen når tastaturet er oppe, se BottomBar.
  const keyboardOffset = Math.max(insets.bottom, 12) - 12;

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: conversation.title,
          headerTitle: () => (
            <View className="items-center">
              <Text className="font-semibold" numberOfLines={1}>
                {conversation.title}
              </Text>
              {isGroup && (
                <Text className="text-muted-foreground text-xs">
                  {conversation.memberCount} medlemmer
                </Text>
              )}
            </View>
          ),
        }}
      />

      {messages.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : (
        <FlatList
          inverted
          data={all}
          keyExtractor={(m) => m.id}
          className="flex-1"
          contentContainerClassName="px-3 py-3"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderScrollComponent={(props: ScrollViewProps) => (
            <KeyboardChatScrollView {...props} inverted offset={keyboardOffset} />
          )}
          onEndReached={() => messages.hasNextPage && messages.fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            messages.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null
          }
          ListEmptyComponent={
            // Listen er snudd, så tom-teksten må snus tilbake.
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <EmptyState text="Ingen meldinger ennå. Si hei! 👋" />
            </View>
          }
          renderItem={({ item, index }) => (
            <MessageItem
              message={item}
              older={all[index + 1]}
              isMine={item.sender.id === me.id}
              showSender={isGroup}
            />
          )}
        />
      )}

      <Composer conversationId={conversation.id} me={me} />
    </View>
  );
}

function MessageItem({
  message,
  older,
  isMine,
  showSender,
}: {
  message: Message;
  older: Message | undefined;
  isMine: boolean;
  showSender: boolean;
}) {
  const newDay = !older || !sameDay(older.sentAt, message.sentAt);
  // Første melding i en rekke fra samme person: vis navn og bilde.
  const startsRun =
    newDay ||
    older.sender.id !== message.sender.id ||
    new Date(message.sentAt).getTime() - new Date(older.sentAt).getTime() > GROUP_WINDOW_MS;
  const pending = message.id.startsWith('temp-');

  return (
    <View>
      {newDay && (
        <Text className="text-muted-foreground py-3 text-center text-xs font-medium">
          {formatDay(message.sentAt)}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-end gap-2',
          isMine ? 'justify-end' : 'justify-start',
          startsRun ? 'mt-2' : 'mt-0.5'
        )}>
        {!isMine && showSender && (
          <View className="w-8">
            {startsRun && <UserAvatar user={message.sender} className="size-8" />}
          </View>
        )}
        <View className={cn('max-w-[78%] gap-0.5', isMine ? 'items-end' : 'items-start')}>
          {!isMine && showSender && startsRun && (
            <Text className="text-muted-foreground px-1 text-xs">{message.sender.name}</Text>
          )}
          <View
            className={cn(
              'rounded-2xl px-3 py-2',
              isMine ? 'bg-brand' : 'bg-muted',
              pending && 'opacity-60'
            )}>
            <Text className={cn('text-[15px] leading-5', isMine && 'text-white')}>
              {message.body}
            </Text>
            <Text
              className={cn(
                'self-end text-[10px]',
                isMine ? 'text-white/70' : 'text-muted-foreground'
              )}>
              {pending ? 'Sender …' : formatTime(message.sentAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Composer({ conversationId, me }: { conversationId: string; me: User }) {
  const [text, setText] = useState('');
  const send = useSendMessage(conversationId, me);
  const canSend = text.trim().length > 0;

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body, {
      onError: (error) => {
        setText(body);
        Alert.alert('Meldingen ble ikke sendt', error.message);
      },
    });
  };

  return (
    <BottomBar>
      <View className="flex-row items-end gap-2">
        <Input
          className="max-h-32 min-h-10 flex-1 rounded-3xl py-2.5"
          value={text}
          onChangeText={setText}
          placeholder="Skriv en melding"
          multiline
          maxLength={4000}
        />
        <Pressable
          onPress={submit}
          disabled={!canSend}
          hitSlop={8}
          accessibilityLabel="Send"
          className="bg-brand size-10 items-center justify-center rounded-full active:opacity-70 disabled:opacity-40">
          <Icon as={Send} size={18} className="text-white" />
        </Pressable>
      </View>
    </BottomBar>
  );
}
