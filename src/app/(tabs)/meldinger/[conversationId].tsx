import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Ban,
  Check,
  CheckCheck,
  Copy,
  Flag,
  Pencil,
  Reply,
  Star,
  Trash2,
} from 'lucide-react-native';
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

import {
  ChatComposer,
  useComposerLayout,
  type ComposerTarget,
} from '@/components/sporty/chat-composer';
import { EmptyState } from '@/components/sporty/empty-state';
import { MessageMenu, type MessageMenuAction } from '@/components/sporty/message-menu';
import { MessageReactions } from '@/components/sporty/message-reactions';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useFavoriteGifs, useToggleFavoriteGif } from '@/data/gifs';
import {
  useConversation,
  useDeleteMessage,
  useReactToMessage,
  useMarkConversationRead,
  useMe,
  useMessages,
} from '@/data/hooks';
import { useBlockUser, useReportMessage } from '@/data/moderation';
import type { ConversationDetails, Message, ReportReason, User } from '@/data/types';
import { formatTime } from '@/lib/dates';
import { REPORT_REASONS, canStillChange } from '@/lib/messages';
import { setOpenScreen } from '@/lib/notifications';
import { cn } from '@/lib/utils';

type Status = 'delivered' | 'read' | null;

/** Bredden på GIF-er i chatten, og grensene for høyden så veldig smale ikke tar hele skjermen. */
const GIF_WIDTH = 220;
const GIF_MIN_HEIGHT = 90;
const GIF_MAX_HEIGHT = 280;

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
  const deleteMessage = useDeleteMessage(conversation.id);
  const { mutate: react } = useReactToMessage(conversation.id, me);
  const reactionParams = (messageId: string) => ({ conversationId: conversation.id, messageId });
  const isGroup = conversation.group !== null;
  const [menu, setMenu] = useState<{ message: Message; status: Status } | null>(null);
  const [text, setText] = useState('');
  const [target, setTarget] = useState<ComposerTarget>(null);
  const layout = useComposerLayout(insets.bottom);
  const favorites = useFavoriteGifs();
  const { mutate: toggleFavorite } = useToggleFavoriteGif();
  const { mutate: reportMessage } = useReportMessage(conversation.id);
  const { mutate: blockUser } = useBlockUser();

  const report = (message: Message) => {
    const send = (reason: ReportReason) =>
      reportMessage(
        { messageId: message.id, reason },
        {
          onSuccess: () => Alert.alert('Takk', 'Meldingen er rapportert.'),
          onError: (error) => Alert.alert('Rapporten ble ikke sendt', error.message),
        }
      );
    Alert.alert('Hvorfor rapporterer du meldingen?', undefined, [
      ...REPORT_REASONS.map((r) => ({ text: r.label, onPress: () => send(r.value) })),
      { text: 'Avbryt', style: 'cancel' },
    ]);
  };

  const block = (user: User) =>
    Alert.alert(
      `Blokkere ${user.name}?`,
      'Du ser ikke lenger meldingene deres, og dere kan ikke sende direktemeldinger til hverandre.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Blokker',
          style: 'destructive',
          onPress: () =>
            blockUser(user.id, {
              onError: (error) => Alert.alert('Personen ble ikke blokkert', error.message),
            }),
        },
      ]
    );

  const all = messages.data?.pages.flatMap((p) => p.messages) ?? [];
  const newestId = all[0]?.id;
  // Lest-status vises bare når den nyeste meldingen i samtalen er min egen.
  const readAt = messages.data?.pages[0]?.readAt ?? null;

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
          // Listen er snudd, så hodet er nederst på skjermen, under den nyeste meldingen.
          ListHeaderComponent={<View style={{ height: layout.restingPadding }} />}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => layout.open && layout.closePanel()}
          renderScrollComponent={(props: ScrollViewProps) => (
            <KeyboardChatScrollView
              {...props}
              inverted
              offset={layout.keyboardOffset}
              extraContentPadding={layout.extraContentPadding}
            />
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
              status={
                index === 0 && item.sender.id === me.id
                  ? readAt && readAt >= item.sentAt
                    ? 'read'
                    : 'delivered'
                  : null
              }
              onShowReactions={() =>
                router.push({ pathname: '/reaksjoner', params: reactionParams(item.id) })
              }
              onLongPress={(status) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMenu({ message: item, status });
              }}
            />
          )}
        />
      )}

      <ChatComposer
        layout={layout}
        conversationId={conversation.id}
        me={me}
        text={text}
        setText={setText}
        target={target}
        onCancel={() => {
          // Avbrutt redigering skal ikke la teksten bli liggende i feltet.
          if (target?.mode === 'edit') setText('');
          setTarget(null);
        }}
      />

      {menu && (
        <MessageMenu
          visible
          onClose={() => setMenu(null)}
          alignEnd={menu.message.sender.id === me.id}
          myReactions={menu.message.reactions.filter((r) => r.mine).map((r) => r.emoji)}
          onReact={
            menu.message.deleted || menu.message.id.startsWith('temp-')
              ? undefined
              : (emoji) => react({ messageId: menu.message.id, emoji })
          }
          onMoreReactions={() =>
            router.push({ pathname: '/emoji', params: reactionParams(menu.message.id) })
          }
          preview={
            <Bubble
              message={menu.message}
              isMine={menu.message.sender.id === me.id}
              status={menu.status}
            />
          }
          actions={messageActions(menu.message, me, {
            isFavorite: favorites.data?.some((g) => g.slug === menu.message.gif?.slug) ?? false,
            toggleFavorite: (favorite) => {
              if (menu.message.gif) {
                toggleFavorite({ gif: { ...menu.message.gif, title: '' }, favorite });
              }
            },
            report: () => report(menu.message),
            block: () => block(menu.message.sender),
            reply: () => setTarget({ mode: 'reply', message: menu.message }),
            edit: () => {
              setTarget({ mode: 'edit', message: menu.message });
              setText(menu.message.body);
            },
            remove: () =>
              Alert.alert('Slette meldingen?', 'Den blir borte for alle i samtalen.', [
                { text: 'Avbryt', style: 'cancel' },
                {
                  text: 'Slett',
                  style: 'destructive',
                  onPress: () =>
                    deleteMessage.mutate(menu.message.id, {
                      onError: (error) => Alert.alert('Meldingen ble ikke slettet', error.message),
                    }),
                },
              ]),
          })}
        />
      )}
    </View>
  );
}

/**
 * Svar og Kopier for alle meldinger, Rediger og Slett for egne de første 15 minuttene. GIF-er kan
 * lagres i favorittene, men ikke kopieres eller redigeres. Slettede meldinger har ingen valg.
 */
function messageActions(
  message: Message,
  me: User,
  handlers: {
    isFavorite: boolean;
    toggleFavorite: (favorite: boolean) => void;
    report: () => void;
    block: () => void;
    reply: () => void;
    edit: () => void;
    remove: () => void;
  }
): MessageMenuAction[] {
  if (message.deleted || message.id.startsWith('temp-')) return [];
  const mine = message.sender.id === me.id && canStillChange(message.sentAt);
  return [
    { label: 'Svar', icon: Reply, onPress: handlers.reply },
    ...(message.gif
      ? [
          {
            label: handlers.isFavorite ? 'Fjern fra favoritter' : 'Legg til i favoritter',
            icon: Star,
            onPress: () => handlers.toggleFavorite(!handlers.isFavorite),
          },
        ]
      : [
          {
            label: 'Kopier',
            icon: Copy,
            onPress: () => Clipboard.setStringAsync(message.body),
          },
        ]),
    ...(mine && !message.gif ? [{ label: 'Rediger', icon: Pencil, onPress: handlers.edit }] : []),
    ...(mine
      ? [{ label: 'Slett', icon: Trash2, onPress: handlers.remove, destructive: true }]
      : []),
    ...(message.sender.id === me.id
      ? []
      : [
          { label: 'Rapporter', icon: Flag, onPress: handlers.report },
          {
            label: `Blokker ${message.sender.name.split(' ')[0]}`,
            icon: Ban,
            onPress: handlers.block,
            destructive: true,
          },
        ]),
  ];
}

function MessageItem({
  message,
  older,
  isMine,
  showSender,
  status,
  onLongPress,
  onShowReactions,
}: {
  message: Message;
  older: Message | undefined;
  isMine: boolean;
  showSender: boolean;
  status: Status;
  onLongPress: (status: Status) => void;
  onShowReactions: () => void;
}) {
  const newDay = !older || !sameDay(older.sentAt, message.sentAt);
  // Første melding i en rekke fra samme person: vis navn og bilde.
  const startsRun =
    newDay ||
    older.sender.id !== message.sender.id ||
    new Date(message.sentAt).getTime() - new Date(older.sentAt).getTime() > GROUP_WINDOW_MS;
  const hasActions = !message.deleted && !message.id.startsWith('temp-');

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
          <Pressable
            disabled={!hasActions}
            onLongPress={() => onLongPress(status)}
            accessibilityHint={hasActions ? 'Hold inne for flere valg' : undefined}
            className="active:opacity-80">
            <Bubble message={message} isMine={isMine} status={status} />
          </Pressable>
          <MessageReactions reactions={message.reactions} onPress={onShowReactions} />
        </View>
      </View>
    </View>
  );
}

function Bubble({
  message,
  isMine,
  status,
}: {
  message: Message;
  isMine: boolean;
  status: Status;
}) {
  const pending = message.id.startsWith('temp-');
  const { gif } = message;
  // GIF-er har ingen boble, så tekst rundt dem står rett på bakgrunnen.
  const onBrand = isMine && !gif;

  return (
    <View
      className={cn(
        !gif && 'rounded-2xl px-3 py-2',
        message.deleted ? 'border-border border' : !gif && (isMine ? 'bg-brand' : 'bg-muted'),
        pending && 'opacity-60'
      )}>
      {message.replyTo && !message.deleted && (
        <View
          className={cn(
            'mb-1.5 rounded-lg border-l-2 px-2 py-1',
            onBrand ? 'border-white/70 bg-white/15' : 'border-brand bg-muted'
          )}>
          <Text
            className={cn('text-xs font-semibold', onBrand ? 'text-white' : 'text-brand')}
            numberOfLines={1}>
            {message.replyTo.senderName}
          </Text>
          <Text
            className={cn(
              'text-[13px] leading-4',
              onBrand ? 'text-white/80' : 'text-muted-foreground',
              message.replyTo.deleted && 'italic'
            )}
            numberOfLines={2}>
            {message.replyTo.deleted ? 'Meldingen ble slettet' : message.replyTo.body}
          </Text>
        </View>
      )}
      {message.deleted ? (
        <Text className="text-muted-foreground text-[15px] italic leading-5">
          Meldingen ble slettet
        </Text>
      ) : gif ? (
        <Image
          source={{ uri: gif.url }}
          accessibilityLabel="GIF"
          contentFit="cover"
          style={{
            width: GIF_WIDTH,
            height: Math.min(
              GIF_MAX_HEIGHT,
              Math.max(GIF_MIN_HEIGHT, (GIF_WIDTH * gif.height) / gif.width)
            ),
            borderRadius: 12,
          }}
        />
      ) : (
        <Text className={cn('text-[15px] leading-5', isMine && 'text-white')}>{message.body}</Text>
      )}
      <View className={cn('flex-row items-center gap-1 self-end', gif && 'px-0.5 pt-1')}>
        <Text
          className={cn(
            'text-[10px]',
            onBrand && !message.deleted ? 'text-white/70' : 'text-muted-foreground'
          )}>
          {pending
            ? 'Sender …'
            : `${message.edited && !message.deleted ? 'redigert · ' : ''}${formatTime(message.sentAt)}`}
        </Text>
        {/* «Levert» først når serveren har tatt imot meldingen. */}
        {!pending && status && (
          <Icon
            as={status === 'read' ? CheckCheck : Check}
            size={14}
            className={message.deleted || gif ? 'text-muted-foreground' : 'text-white/70'}
            accessibilityLabel={status === 'read' ? 'Lest' : 'Levert'}
          />
        )}
      </View>
    </View>
  );
}
