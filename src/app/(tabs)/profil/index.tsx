import { Link } from 'expo-router';
import { BellRing, ChevronRight, Moon, Settings, UserCog } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { GroupAvatar } from '@/components/sporty/group-avatar';
import { QueryState } from '@/components/sporty/query-state';
import { UserAvatar } from '@/components/sporty/user-row';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { APPEARANCE_OPTIONS, useAppearancePreference } from '@/data/appearance';
import { useMe, useMyFines, useMyGroups } from '@/data/hooks';
import type { Role } from '@/data/types';
import { formatDateLong } from '@/lib/dates';
import { formatFineCount, isUnpaid } from '@/lib/fines';

const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', subadmin: 'Subadmin', member: 'Medlem' };

export default function ProfilScreen() {
  const me = useMe();
  const groups = useMyGroups();
  const fines = useMyFines();
  const unpaidCount = (fines.data ?? []).filter(isUnpaid).reduce((sum, f) => sum + f.count, 0);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-6 p-4 pb-12">
      <QueryState query={me}>
        {(user) => (
          <View className="items-center gap-2">
            <UserAvatar user={user} className="size-24" />
            <Text variant="h3">{user.name}</Text>
            {user.email && <Text className="text-muted-foreground">{user.email}</Text>}
            {user.inactiveIn.map((inactive) => (
              <View
                key={inactive.groupId}
                className="bg-muted/60 mt-2 w-full gap-1 rounded-2xl p-4">
                <View className="flex-row items-center gap-2">
                  <Badge variant="outline">
                    <Text>Inaktiv</Text>
                  </Badge>
                  <Text className="flex-1 font-medium" numberOfLines={1}>
                    {inactive.groupName}
                  </Text>
                </View>
                <Text>{inactive.reason}</Text>
                <Text className="text-muted-foreground text-xs">
                  Siden {formatDateLong(inactive.since)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </QueryState>

      <View className="bg-muted/60 rounded-2xl p-4">
        <Text className="text-muted-foreground text-sm">Ubetalte bøter</Text>
        <Text variant="h3">{formatFineCount(unpaidCount)}</Text>
      </View>

      <Section title="Mine grupper">
        <QueryState query={groups}>
          {(data) =>
            data.map((group, index) => (
              <View key={group.id}>
                {index > 0 && <Separator />}
                <Link href={`/grupper/${group.id}`} asChild>
                  <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
                    <GroupAvatar group={group} size={36} />
                    <Text className="flex-1 font-medium">{group.name}</Text>
                    {group.myRole && group.myRole !== 'member' && (
                      <Badge variant="secondary">
                        <Text>{ROLE_LABEL[group.myRole]}</Text>
                      </Badge>
                    )}
                    <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
                  </Pressable>
                </Link>
              </View>
            ))
          }
        </QueryState>
      </Section>

      <DevUserSwitcher />

      <Section title="Innstillinger">
        <Link href="/profil/innstillinger" asChild>
          <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
            <Icon as={Settings} size={18} />
            <View className="flex-1">
              <Text>Profilinnstillinger</Text>
              <Text className="text-muted-foreground text-xs">
                Pushvarsler, kalender og logg ut
              </Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </Pressable>
        </Link>
        <Separator />
        <AppearanceRow />
      </Section>
    </ScrollView>
  );
}

/** Kun i utvikling: bytt bruker for å teste ulike roller, og test varsler. */
function DevUserSwitcher() {
  if (!__DEV__) return null;

  return (
    <Section title="Utvikling">
      <Link href="/bytt-bruker" asChild>
        <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
          <Icon as={UserCog} size={18} />
          <View className="flex-1">
            <Text>Bytt bruker</Text>
            <Text className="text-muted-foreground text-xs">
              Test appen som admin, subadmin eller medlem
            </Text>
          </View>
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        </Pressable>
      </Link>
      <Separator />
      <Link href="/test-varsler" asChild>
        <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
          <Icon as={BellRing} size={18} />
          <View className="flex-1">
            <Text>Test varsler</Text>
            <Text className="text-muted-foreground text-xs">
              Se hvordan bot- og påminnelsesvarslene ser ut
            </Text>
          </View>
          <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
        </Pressable>
      </Link>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-muted-foreground text-sm font-medium">{title}</Text>
      <View className="bg-muted/60 rounded-2xl px-4">{children}</View>
    </View>
  );
}

/** Åpner valget mellom Automatisk, Lys og Mørk, og viser hva som er valgt nå. */
function AppearanceRow() {
  const preference = useAppearancePreference();
  const current = APPEARANCE_OPTIONS.find((o) => o.value === preference)?.label;

  return (
    <Link href="/utseende" asChild>
      <Pressable className="flex-row items-center gap-3 py-3 active:opacity-70">
        <Icon as={Moon} size={18} />
        <Text className="flex-1">Utseende</Text>
        <Text className="text-muted-foreground text-sm">{current}</Text>
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      </Pressable>
    </Link>
  );
}
