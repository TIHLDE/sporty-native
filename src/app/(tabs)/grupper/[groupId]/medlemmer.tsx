import { Link, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, SectionList, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';
import type { GroupDetails, Member } from '@/data/types';

const ROLE_LABEL = { admin: 'Admin', subadmin: 'Subadmin', botsjef: 'Botsjef' } as const;

export default function MedlemmerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);
  const [query, setQuery] = useState('');

  return (
    <QueryState query={group}>
      {(data) => {
        const q = query.trim().toLowerCase();
        const members = q
          ? data.members.filter((m) => m.user.name.toLowerCase().includes(q))
          : data.members;
        const header = <ListHeader group={data} query={query} onQueryChange={setQuery} />;
        return data.usesPositions ? (
          <ByPosition group={data} members={members} header={header} />
        ) : (
          <AllMembers group={data} members={members} header={header} />
        );
      }}
    </QueryState>
  );
}

/** Søk og antall. Sub-/admin får vite at de kan trykke på et medlem. */
function ListHeader({
  group,
  query,
  onQueryChange,
}: {
  group: GroupDetails;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const inactive = group.members.filter((m) => m.inactive).length;
  return (
    <View className="gap-2 pb-1 pt-3">
      <View className="justify-center">
        <Input
          value={query}
          onChangeText={onQueryChange}
          placeholder="Søk etter medlem"
          autoCorrect={false}
          className="rounded-full pl-9"
        />
        <View className="absolute left-3 h-10 justify-center" pointerEvents="none">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
      </View>
      <Text className="text-muted-foreground text-sm">
        {group.members.length} medlemmer
        {inactive > 0 ? ` · ${inactive} inaktive` : ''}
        {group.canManage ? ' · trykk på et medlem for å endre' : ''}
      </Text>
    </View>
  );
}

function RoleBadge({ member }: { member: Member }) {
  // Index skal ikke fremheves, så de vises som vanlige medlemmer.
  if (member.role === 'member' || member.role === 'index') return null;
  return (
    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
      <Text>{ROLE_LABEL[member.role]}</Text>
    </Badge>
  );
}

function InactiveBadge({ member }: { member: Member }) {
  if (!member.inactive) return null;
  return (
    <Badge variant="outline">
      <Text>Inaktiv</Text>
    </Badge>
  );
}

/**
 * Grå linje under navnet: inaktiv-begrunnelsen hvis medlemmet er inaktivt (den får bare sub-/admin
 * og medlemmet selv), ellers undergruppene. Posisjonen står som overskrift når gruppen bruker dem.
 */
const subtitle = (member: Member) =>
  member.inactive?.reason
    ? `Inaktiv: ${member.inactive.reason}`
    : member.subgroupNames.join(', ') || undefined;

/** Én rad. Sub-/admin kan trykke for å åpne medlemmet og endre rolle, posisjon, undergrupper og status. */
function MemberRow({ group, member }: { group: GroupDetails; member: Member }) {
  const row = (
    <UserRow
      user={member.user}
      subtitle={subtitle(member)}
      right={
        <View className="flex-row items-center gap-2">
          <InactiveBadge member={member} />
          <RoleBadge member={member} />
          {group.canManage && (
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          )}
        </View>
      }
    />
  );
  if (!group.canManage) return row;
  return (
    <Link href={`/grupper/${group.id}/medlem/${member.user.id}`} asChild>
      <Pressable className="active:opacity-70">{row}</Pressable>
    </Link>
  );
}

function AllMembers({
  group,
  members,
  header,
}: {
  group: GroupDetails;
  members: Member[];
  header: React.ReactElement;
}) {
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      data={members}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState text="Fant ingen medlemmer" />}
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item }) => <MemberRow group={group} member={item} />}
    />
  );
}

/** Medlemmene gruppert etter posisjon, i rekkefølgen admin har satt. */
function ByPosition({
  group,
  members,
  header,
}: {
  group: GroupDetails;
  members: Member[];
  header: React.ReactElement;
}) {
  const sections = [
    ...group.positions.map((position) => ({
      key: position.id,
      title: position.name,
      data: members.filter((m) => m.position?.id === position.id),
    })),
    { key: 'none', title: 'Uten posisjon', data: members.filter((m) => !m.position) },
  ].filter((section) => section.data.length > 0);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      sections={sections}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState text="Fant ingen medlemmer" />}
      renderSectionHeader={({ section }) => (
        <Text className="pb-1 pt-5 font-semibold">
          {section.title}{' '}
          <Text className="text-muted-foreground text-sm">({section.data.length})</Text>
        </Text>
      )}
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item }) => <MemberRow group={group} member={item} />}
    />
  );
}
