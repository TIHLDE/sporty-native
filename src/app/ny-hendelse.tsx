import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { FormScrollView } from '@/components/sporty/form-scroll-view';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useEvent, useGroup, useMatchFacts, useMatchStatMutations } from '@/data/hooks';
import type { Event, MatchFacts, User } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * (Sub-/admin) Registrer en hendelse i kampfakta: velg type, og trykk på spilleren. De som har
 * meldt seg på kampen står øverst.
 */
export default function NyHendelseScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const event = useEvent(eventId);
  const facts = useMatchFacts(eventId);
  return (
    <QueryState query={event}>
      {(eventData) => (
        <QueryState query={facts}>
          {(factsData) => <WithMembers event={eventData} facts={factsData} />}
        </QueryState>
      )}
    </QueryState>
  );
}

function WithMembers({ event, facts }: { event: Event; facts: MatchFacts }) {
  const group = useGroup(event.groupId);
  return (
    <QueryState query={group}>
      {(groupData) => (
        <Form event={event} facts={facts} users={groupData.members.map((m) => m.user)} />
      )}
    </QueryState>
  );
}

function Form({ event, facts, users }: { event: Event; facts: MatchFacts; users: User[] }) {
  const { add } = useMatchStatMutations(event.id);
  const [typeId, setTypeId] = useState(facts.types[0]?.id ?? null);
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const visible = users
    .filter((user) => user.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
  const coming = visible.filter((user) => event.attendance[user.id] === 'kommer');
  const others = visible.filter((user) => event.attendance[user.id] !== 'kommer');

  const pick = (user: User) => {
    if (!typeId) return;
    add.mutate(
      { typeId, userId: user.id },
      {
        onSuccess: () => router.back(),
        onError: (error) => Alert.alert('Kunne ikke lagre hendelsen', error.message),
      }
    );
  };

  if (facts.types.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-muted-foreground">
          Laget har ingen hendelser i kampfakta. Admin legger dem til under Innstillinger →
          Kampfakta.
        </Text>
      </View>
    );
  }

  return (
    <FormScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      <View className="gap-2">
        <Text className="text-muted-foreground text-sm font-medium">Hendelse</Text>
        <View className="flex-row flex-wrap gap-2">
          {facts.types.map((type) => {
            const selected = type.id === typeId;
            return (
              <Pressable
                key={type.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setTypeId(type.id)}
                className={cn(
                  'rounded-full border px-4 py-2 active:opacity-70',
                  selected ? 'bg-brand border-brand' : 'border-border'
                )}>
                <Text className={cn('font-medium', selected && 'text-white')}>{type.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-muted-foreground text-sm font-medium">Spiller</Text>
        <Input value={search} onChangeText={setSearch} placeholder="Søk etter navn" />
        {visible.length === 0 && (
          <Text className="text-muted-foreground py-4 text-center">Ingen treff</Text>
        )}
        <PlayerList title="Påmeldt" users={coming} onPick={pick} disabled={add.isPending} />
        <PlayerList
          title={coming.length > 0 ? 'Andre i gruppen' : undefined}
          users={others}
          onPick={pick}
          disabled={add.isPending}
        />
      </View>
    </FormScrollView>
  );
}

function PlayerList({
  title,
  users,
  onPick,
  disabled,
}: {
  title?: string;
  users: User[];
  onPick: (user: User) => void;
  disabled: boolean;
}) {
  if (users.length === 0) return null;
  return (
    <View className="gap-2">
      {title && <Text className="text-muted-foreground text-xs">{title}</Text>}
      <View className="bg-muted/60 rounded-2xl px-4">
        {users.map((user, index) => (
          <View key={user.id}>
            {index > 0 && <Separator />}
            <Pressable
              disabled={disabled}
              onPress={() => onPick(user)}
              className="flex-row items-center gap-3 py-2.5 active:opacity-70">
              <UserAvatar user={user} />
              <Text className="flex-1 font-medium">{user.name}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
