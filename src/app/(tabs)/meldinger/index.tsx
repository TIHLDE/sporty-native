import { Link, Stack } from 'expo-router';
import { SquarePen } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupAvatar } from '@/components/sporty/group-avatar';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useConversations } from '@/data/hooks';
import { useSession } from '@/data/session';
import type { Conversation } from '@/data/types';
import { formatRelative } from '@/lib/dates';
import { cn } from '@/lib/utils';

export default function MeldingerScreen() {
  const conversations = useConversations();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/meldinger/ny" asChild>
              <Pressable hitSlop={8} className="px-1" accessibilityLabel="Ny melding">
                <Icon as={SquarePen} size={20} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <QueryState query={conversations}>
        {(data) => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerClassName="px-4 pb-12"
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ConversationRow conversation={item} />}
            ItemSeparatorComponent={() => <Separator />}
            ListEmptyComponent={<EmptyState text="Ingen samtaler ennå" />}
            refreshControl={
              <RefreshControl
                refreshing={conversations.isRefetching}
                onRefresh={conversations.refetch}
              />
            }
          />
        )}
      </QueryState>
    </>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const { userId } = useSession();
  const last = conversation.lastMessage;
  const unread = conversation.unread > 0;

  return (
    <Link href={`/meldinger/${conversation.id}`} asChild>
      <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
        {conversation.group ? (
          <GroupAvatar group={conversation.group} size={44} />
        ) : (
          conversation.otherUser && <UserAvatar user={conversation.otherUser} className="size-11" />
        )}
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 font-semibold" numberOfLines={1}>
              {conversation.title}
            </Text>
            {last && (
              <Text className="text-muted-foreground text-xs">{formatRelative(last.sentAt)}</Text>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <Text
              className={cn('flex-1 text-sm', unread ? 'font-medium' : 'text-muted-foreground')}
              numberOfLines={1}>
              {last
                ? `${last.senderId === userId ? 'Du' : last.senderName.split(' ')[0]}: ${last.body}`
                : 'Ingen meldinger ennå'}
            </Text>
            {unread && (
              <View className="bg-brand min-w-5 items-center rounded-full px-1.5">
                <Text className="text-xs font-semibold text-white">{conversation.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
