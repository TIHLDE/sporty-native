import { Link, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FlatList, Pressable, SectionList, View } from 'react-native';

import { QueryState } from '@/components/sporty/query-state';
import { UserRow } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/data/hooks';
import type { GroupDetails, Member } from '@/data/types';
import { POSITIONS } from '@/lib/positions';

const ROLE_LABEL = { admin: 'Admin', subadmin: 'Subadmin' } as const;

export default function MedlemmerScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId);

  return (
    <QueryState query={group}>
      {(data) => (data.usesPositions ? <ByPosition group={data} /> : <AllMembers group={data} />)}
    </QueryState>
  );
}

const isManager = (group: GroupDetails) => group.myRole === 'admin' || group.myRole === 'subadmin';

function RoleBadge({ member }: { member: Member }) {
  if (member.role === 'member') return null;
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

/** Begrunnelsen vises bare for dem som får den fra API-et (sub-/admin og medlemmet selv). */
const inactiveSubtitle = (member: Member) =>
  member.inactive?.reason ? `Inaktiv: ${member.inactive.reason}` : undefined;

/** Alle medlemmene. Sub-/admin kan trykke på et medlem for å gjøre det inaktivt. */
function AllMembers({ group }: { group: GroupDetails }) {
  const manage = isManager(group);
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      data={group.members}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={
        <Text className="text-muted-foreground py-3 text-sm">
          {group.members.length} medlemmer
          {manage ? ' · trykk på et medlem for å gjøre det inaktivt' : ''}
        </Text>
      }
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item }) => {
        const row = (
          <UserRow
            user={item.user}
            // Undergruppene medlemmet er med i, i grått under navnet.
            subtitle={inactiveSubtitle(item) ?? (item.subgroupNames.join(' · ') || undefined)}
            right={
              <View className="flex-row items-center gap-2">
                <InactiveBadge member={item} />
                <RoleBadge member={item} />
                {manage && <Icon as={ChevronRight} size={18} className="text-muted-foreground" />}
              </View>
            }
          />
        );
        if (!manage) return row;
        return (
          <Link
            href={{ pathname: '/inaktiv', params: { groupId: group.id, userId: item.user.id } }}
            asChild>
            <Pressable className="active:opacity-70">{row}</Pressable>
          </Link>
        );
      }}
    />
  );
}

/** Medlemmene gruppert etter stilling (keeper bakerst, spiss fremst). Sub-/admin kan endre stilling. */
function ByPosition({ group }: { group: GroupDetails }) {
  const manage = isManager(group);
  const sections = [
    ...POSITIONS.map(({ value, label }) => ({
      key: value,
      title: label,
      data: group.members.filter((m) => m.position === value),
    })),
    { key: 'none', title: 'Uten stilling', data: group.members.filter((m) => !m.position) },
  ].filter((section) => section.data.length > 0);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      stickySectionHeadersEnabled={false}
      sections={sections}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={
        <Text className="text-muted-foreground pt-3 text-sm">
          {group.members.length} spillere
          {manage ? ' · trykk på en spiller for å endre stilling eller gjøre inaktiv' : ''}
        </Text>
      }
      renderSectionHeader={({ section }) => (
        <Text className="pb-1 pt-5 font-semibold">
          {section.title}{' '}
          <Text className="text-muted-foreground text-sm">({section.data.length})</Text>
        </Text>
      )}
      ItemSeparatorComponent={() => <Separator />}
      renderItem={({ item }) => {
        const row = (
          <UserRow
            user={item.user}
            subtitle={inactiveSubtitle(item)}
            right={
              <View className="flex-row items-center gap-2">
                <InactiveBadge member={item} />
                <RoleBadge member={item} />
                {manage && <Icon as={ChevronRight} size={18} className="text-muted-foreground" />}
              </View>
            }
          />
        );
        if (!manage) return row;
        return (
          <Link
            href={{
              pathname: '/velg-stilling',
              params: { groupId: group.id, userId: item.user.id },
            }}
            asChild>
            <Pressable className="active:opacity-70">{row}</Pressable>
          </Link>
        );
      }}
    />
  );
}
