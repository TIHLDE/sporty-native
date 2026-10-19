import { Link } from 'expo-router';
import { Check, ChevronRight, EyeOff, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { useVote } from '@/data/hooks';
import type { Poll } from '@/data/types';
import { formatEventStart } from '@/lib/dates';
import { cn } from '@/lib/utils';

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Avstemning med stemming rett i kortet. Ett valg: trykk for å stemme. Flervalg: velg alternativer
 * og trykk "Lagre stemme". Med `linkToDetails` åpner overskriften avstemningen med kommentarer.
 */
export function PollCard({ poll, linkToDetails = false }: { poll: Poll; linkToDetails?: boolean }) {
  const vote = useVote(poll.id);
  // Lokalt valg for flervalg, før det lagres.
  const [draft, setDraft] = useState<string[] | null>(null);
  const selected = vote.isPending ? vote.variables : (draft ?? poll.myOptionIds);
  const changed = draft !== null && !sameSet(draft, poll.myOptionIds);

  const save = (optionIds: string[]) =>
    vote.mutate(optionIds, {
      onSuccess: () => setDraft(null),
      onError: (error) => Alert.alert('Kunne ikke stemme', error.message),
    });

  const press = (optionId: string) => {
    if (poll.allowMultiple) {
      const current = draft ?? poll.myOptionIds;
      setDraft(
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
      );
    } else {
      // Trykk på valgt alternativ igjen fjerner stemmen.
      save(poll.myOptionIds.includes(optionId) ? [] : [optionId]);
    }
  };

  const totalVotes = poll.options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);

  const header = (
    <View className="flex-row items-start gap-2">
      <View className="flex-1 gap-1">
        <Text className="font-semibold">{poll.question}</Text>
        {poll.description ? (
          <Text
            className="text-muted-foreground text-sm"
            numberOfLines={linkToDetails ? 2 : undefined}>
            {poll.description}
          </Text>
        ) : null}
      </View>
      {linkToDetails && (
        <Icon as={ChevronRight} size={18} className="text-muted-foreground mt-0.5" />
      )}
    </View>
  );

  return (
    <View className="bg-muted/60 gap-3 rounded-2xl p-4">
      {linkToDetails ? (
        <Link href={`/grupper/${poll.groupId}/avstemning/${poll.id}`} asChild>
          <Pressable className="active:opacity-70">{header}</Pressable>
        </Link>
      ) : (
        header
      )}

      {poll.allowMultiple && !poll.closed && (
        <Text className="text-muted-foreground text-xs">Du kan velge flere alternativer</Text>
      )}

      {poll.options.map((option) => {
        const isSelected = selected.includes(option.id);
        const share = totalVotes ? ((option.voteCount ?? 0) / totalVotes) * 100 : 0;
        return (
          <Pressable
            key={option.id}
            disabled={poll.closed || vote.isPending}
            onPress={() => press(option.id)}
            className={cn(
              'gap-2 rounded-xl border p-3 active:opacity-70',
              isSelected ? 'border-brand' : 'border-border'
            )}>
            <View className="flex-row items-center gap-2">
              <View
                className={cn(
                  'size-5 items-center justify-center border',
                  poll.allowMultiple ? 'rounded-md' : 'rounded-full',
                  isSelected ? 'border-brand bg-brand' : 'border-muted-foreground'
                )}>
                {isSelected && <Icon as={Check} size={12} className="text-white" />}
              </View>
              <Text className={cn('flex-1', isSelected && 'font-semibold')}>{option.label}</Text>
              {poll.resultsVisible && (
                <Text className="text-muted-foreground text-sm">{option.voteCount}</Text>
              )}
            </View>
            {poll.resultsVisible && (
              <Progress value={share} indicatorClassName={isSelected ? 'bg-brand' : undefined} />
            )}
          </Pressable>
        );
      })}

      {poll.allowMultiple && changed && !poll.closed && (
        <Button className="bg-brand active:bg-brand/80 rounded-full" onPress={() => save(draft!)}>
          <Text className="text-white">Lagre stemme</Text>
        </Button>
      )}

      {!poll.resultsVisible && (
        <View className="flex-row items-center gap-1.5">
          <Icon as={EyeOff} size={14} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-xs">
            Resultatet vises når fristen har gått ut
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Text className="text-muted-foreground text-xs">
          {poll.closed ? 'Stengt' : `Frist ${formatEventStart(poll.closesAt)}`}
          {poll.voterCount !== null ? ` · ${poll.voterCount} har stemt` : ''}
        </Text>
        {linkToDetails && poll.allowComments && (
          <View className="flex-row items-center gap-1">
            <Icon as={MessageCircle} size={12} className="text-muted-foreground" />
            <Text className="text-muted-foreground text-xs">{poll.commentCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
