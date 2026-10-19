import { Link } from 'expo-router';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import type { Group } from '@/data/types';

import { GroupAvatar } from './group-avatar';

/** Kort i gruppe-rutenettet (Spond-stil). */
export function GroupTile({ group }: { group: Group }) {
  return (
    <Link href={`/grupper/${group.id}`} asChild>
      <Pressable className="bg-muted/60 border-border flex-1 items-center gap-4 rounded-3xl border px-3 py-6 active:opacity-70">
        <GroupAvatar group={group} size={88} />
        <Text className="text-center font-semibold" numberOfLines={2}>
          {group.name}
        </Text>
      </Pressable>
    </Link>
  );
}
