import * as Haptics from 'expo-haptics';
import { Link, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { GroupAvatar } from '@/components/sporty/group-avatar';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useGroup, useSetMemberSubgroups, useSetPosition, useSetRole } from '@/data/hooks';
import type { GroupDetails, Member, Role } from '@/data/types';
import { ROLES, ROLE_LABEL } from '@/lib/roles';
import { cn } from '@/lib/utils';

/**
 * (Sub-/admin) Alt om ett medlem på ett sted: rolle, posisjon, undergrupper og status. Endringer
 * lagres med en gang. Hva man kan endre følger reglene på serveren: rolle og undergrupper er for
 * admin, posisjon og status for sub-/admin.
 */
export default function MedlemScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const group = useGroup(groupId);

  return (
    <QueryState query={group}>
      {(data) => {
        const member = data.members.find((m) => m.user.id === userId);
        return member ? (
          <MemberDetails group={data} member={member} />
        ) : (
          <EmptyState text="Fant ikke medlemmet" />
        );
      }}
    </QueryState>
  );
}

const saved = () => Haptics.selectionAsync();
const failed = (what: string) => (error: Error) =>
  Alert.alert(`Kunne ikke lagre ${what}`, error.message);

function MemberDetails({ group, member }: { group: GroupDetails; member: Member }) {
  const setRole = useSetRole(group.id);
  const setPosition = useSetPosition(group.id);
  const isMainGroup = group.parentId === null;
  // Vis valget med en gang mens det lagres.
  const role: Role = setRole.isPending && setRole.variables ? setRole.variables.role : member.role;
  const positionId =
    setPosition.isPending && setPosition.variables
      ? setPosition.variables.positionId
      : (member.position?.id ?? null);

  const chooseRole = (value: Role) => {
    if (value === role) return;
    setRole.mutate(
      { userId: member.user.id, role: value },
      { onSuccess: saved, onError: failed('rollen') }
    );
  };
  const choosePosition = (value: string | null) => {
    if (value === positionId) return;
    setPosition.mutate(
      { userId: member.user.id, positionId: value },
      { onSuccess: saved, onError: failed('posisjonen') }
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-4 pb-16">
      <View className="items-center gap-1.5">
        <UserAvatar user={member.user} className="size-20" />
        <Text variant="h4" className="text-center">
          {member.user.name}
        </Text>
        {member.user.email && (
          <Text className="text-muted-foreground text-sm">{member.user.email}</Text>
        )}
        <View className="flex-row flex-wrap justify-center gap-1.5 pt-1">
          {role !== 'member' && role !== 'index' && (
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
              <Text>{ROLE_LABEL[role]}</Text>
            </Badge>
          )}
          {member.inactive && (
            <Badge variant="outline">
              <Text>Inaktiv</Text>
            </Badge>
          )}
          {member.subgroupNames.map((name) => (
            <Badge key={name} variant="outline">
              <Text>{name}</Text>
            </Badge>
          ))}
        </View>
      </View>

      <Section title="Rolle">
        {group.canAdmin ? (
          ROLES.filter((r) => r.value !== 'botsjef' || isMainGroup).map((r, index) => (
            <View key={r.value}>
              {index > 0 && <Separator />}
              <Pressable
                disabled={setRole.isPending}
                onPress={() => chooseRole(r.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === r.value }}
                className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
                <View
                  className={cn(
                    'size-5 items-center justify-center rounded-full border-2',
                    role === r.value ? 'border-brand bg-brand' : 'border-muted-foreground/40'
                  )}>
                  {role === r.value && <Icon as={Check} size={12} className="text-white" />}
                </View>
                <View className="flex-1">
                  <Text className="font-medium">{r.label}</Text>
                  <Text className="text-muted-foreground text-xs">{r.description}</Text>
                </View>
              </Pressable>
            </View>
          ))
        ) : (
          <View className="px-4 py-3">
            <Text className="font-medium">{ROLE_LABEL[role]}</Text>
            <Text className="text-muted-foreground text-xs">Bare admin kan endre roller</Text>
          </View>
        )}
      </Section>

      {group.usesPositions && group.positions.length > 0 && (
        <View className="gap-2">
          <SectionTitle>Posisjon</SectionTitle>
          <View className="flex-row flex-wrap gap-2">
            {[...group.positions, { id: null, name: 'Ingen' }].map((p) => {
              const selected = positionId === p.id;
              return (
                <Pressable
                  key={p.id ?? 'none'}
                  disabled={setPosition.isPending}
                  onPress={() => choosePosition(p.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  className={cn(
                    'rounded-full border px-4 py-2 active:opacity-70',
                    selected ? 'border-brand bg-brand' : 'border-border bg-muted/60'
                  )}>
                  <Text className={cn('text-sm font-medium', selected && 'text-white')}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {group.canAdmin && isMainGroup && group.subgroups.length > 0 && (
        <SubgroupsSection group={group} member={member} />
      )}

      <Section title="Status">
        <Link
          href={{ pathname: '/inaktiv', params: { groupId: group.id, userId: member.user.id } }}
          asChild>
          <Pressable className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70">
            <View className="flex-1">
              <Text className="font-medium">
                {member.inactive ? 'Inaktivt medlem' : 'Aktivt medlem'}
              </Text>
              {member.inactive?.reason && (
                <Text className="text-muted-foreground text-sm" numberOfLines={2}>
                  {member.inactive.reason}
                </Text>
              )}
            </View>
            <Text className="text-muted-foreground text-sm">
              {member.inactive ? 'Endre' : 'Gjør inaktiv'}
            </Text>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </Pressable>
        </Link>
      </Section>
    </ScrollView>
  );
}

/** (Admin, hovedgruppe) Hvilke undergrupper medlemmet er med i, med en bryter per undergruppe. */
function SubgroupsSection({ group, member }: { group: GroupDetails; member: Member }) {
  const setSubgroups = useSetMemberSubgroups(group.id);

  const toggle = (subgroupId: string, name: string, on: boolean) => {
    const save = () =>
      setSubgroups.mutate(
        {
          userId: member.user.id,
          subgroupIds: on
            ? [...member.subgroupIds, subgroupId]
            : member.subgroupIds.filter((id) => id !== subgroupId),
        },
        { onSuccess: saved, onError: failed('undergruppene') }
      );
    if (on) return save();
    Alert.alert(
      `Ta ${member.user.name} ut av ${name}?`,
      'Medlemmet fjernes fra alt i undergruppen, også rolle og posisjon der.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Ta ut', style: 'destructive', onPress: save },
      ]
    );
  };

  return (
    <Section title="Undergrupper">
      {group.subgroups.map((subgroup, index) => {
        const on = member.subgroupIds.includes(subgroup.id);
        return (
          <View key={subgroup.id}>
            {index > 0 && <Separator />}
            <View className="flex-row items-center gap-3 px-4 py-3">
              <GroupAvatar group={subgroup} size={28} />
              <Text className="flex-1 font-medium" numberOfLines={1}>
                {subgroup.name}
              </Text>
              <Switch
                checked={on}
                disabled={setSubgroups.isPending}
                onCheckedChange={(value) => toggle(subgroup.id, subgroup.name, value)}
                accessibilityLabel={`Med i ${subgroup.name}`}
              />
            </View>
          </View>
        );
      })}
    </Section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="text-muted-foreground px-1 text-xs font-medium uppercase">{children}</Text>
  );
}

/** Overskrift og et avrundet kort med radene, som gruppeinnstillingene. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <SectionTitle>{title}</SectionTitle>
      <View className="bg-muted/60 overflow-hidden rounded-2xl">{children}</View>
    </View>
  );
}
