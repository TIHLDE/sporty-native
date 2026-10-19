import { Link } from 'expo-router';
import {
  Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Gavel,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native';

import { QueryState } from '@/components/sporty/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { updateCalendarSettings, useCalendarSettings } from '@/data/calendar-settings';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/data/hooks';
import { useSession } from '@/data/session';
import type { NotificationSettings } from '@/data/types';
import { isCalendarAvailable } from '@/lib/calendar-sync';
import { ensureNotificationPermission, useNotificationPermission } from '@/lib/notifications';
import { ACCENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

/** Profil → Innstillinger: pushvarsler, kalender og utlogging. */
export default function InnstillingerScreen() {
  const { signOut } = useSession();
  const confirmSignOut = () =>
    Alert.alert('Logg ut', 'Vil du logge ut av Sporty?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Logg ut', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-8 p-4 pb-16">
      <PushSection />
      <CalendarSection />
      <Section>
        <Pressable
          onPress={confirmSignOut}
          className="flex-row items-center gap-3 py-3.5 active:opacity-70">
          <Icon as={LogOut} size={18} className="text-destructive" />
          <Text className="text-destructive flex-1">Logg ut</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function PushSection() {
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const permission = useNotificationPermission();

  const set = (changes: Partial<NotificationSettings>) =>
    update.mutate(changes, {
      onError: (error) => Alert.alert('Kunne ikke lagre', error.message),
    });

  return (
    <View className="gap-2">
      <SectionTitle>Pushvarsler</SectionTitle>
      {permission === 'unsupported' ? (
        <View className="bg-muted/60 rounded-2xl p-4">
          <Text className="text-sm">
            Varsler virker ikke i Expo Go på Android. Valgene under lagres likevel.
          </Text>
        </View>
      ) : (
        permission !== 'granted' && <PermissionNotice denied={permission === 'denied'} />
      )}
      <QueryState query={settings}>
        {(data) => {
          const subDisabled = !data.pushEnabled;
          return (
            <Section>
              <ToggleRow
                icon={data.pushEnabled ? Bell : BellOff}
                label="Alle pushvarsler"
                value={data.pushEnabled}
                onChange={(pushEnabled) => set({ pushEnabled })}
              />
              <Separator />
              <ToggleRow
                icon={Gavel}
                label="Når jeg får bot"
                value={data.pushFines}
                disabled={subDisabled}
                onChange={(pushFines) => set({ pushFines })}
              />
              <Separator />
              <ToggleRow
                icon={CalendarClock}
                label="1 time før arrangement"
                value={data.pushEventReminders}
                disabled={subDisabled}
                onChange={(pushEventReminders) => set({ pushEventReminders })}
              />
              <Separator />
              <ToggleRow
                icon={CalendarCheck}
                label="1 time før påmeldingsfrist"
                description="Bare hvis du ikke har svart"
                value={data.pushSignupReminders}
                disabled={subDisabled}
                onChange={(pushSignupReminders) => set({ pushSignupReminders })}
              />
            </Section>
          );
        }}
      </QueryState>
    </View>
  );
}

/** Vises når telefonen ikke tillater varsler fra appen, uansett hva som er valgt her. */
function PermissionNotice({ denied }: { denied: boolean }) {
  return (
    <View className="bg-muted/60 gap-3 rounded-2xl p-4">
      <Text className="text-sm">
        {denied
          ? 'Varsler er skrudd av for Sporty i innstillingene på telefonen. Skru dem på der for å få varsler.'
          : 'Sporty har ikke fått lov til å sende varsler ennå.'}
      </Text>
      <Button
        size="sm"
        className="bg-brand active:bg-brand/80 self-start rounded-full"
        onPress={() => (denied ? Linking.openSettings() : ensureNotificationPermission())}>
        <Text className="text-white">{denied ? 'Åpne innstillinger' : 'Slå på varsler'}</Text>
      </Button>
    </View>
  );
}

function CalendarSection() {
  const settings = useCalendarSettings();
  const available = isCalendarAvailable();
  const noCalendar = !settings.calendarId;

  return (
    <View className="gap-2">
      <SectionTitle>Kalender</SectionTitle>
      <Section>
        <Link href="/profil/kalender" asChild disabled={!available}>
          <Pressable
            className={cn(
              'flex-row items-center gap-3 py-3.5 active:opacity-70',
              !available && 'opacity-50'
            )}>
            <Icon as={CalendarDays} size={18} />
            <Text className="flex-1">Standardkalender</Text>
            <Text className="text-muted-foreground max-w-[45%] text-sm" numberOfLines={1}>
              {settings.calendarTitle ?? 'Av'}
            </Text>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </Pressable>
        </Link>
        <Separator />
        <ToggleRow
          icon={CalendarCheck}
          label="Synkroniser aksepterte"
          description="Arrangementer du har svart «Kommer» på"
          value={settings.syncAccepted}
          disabled={!available || noCalendar}
          onChange={(syncAccepted) => updateCalendarSettings({ syncAccepted })}
        />
        <Separator />
        <ToggleRow
          icon={CalendarPlus}
          label="Synkroniser ubesvarte"
          description="Arrangementer du ikke har svart på ennå"
          value={settings.syncUnanswered}
          disabled={!available || noCalendar}
          onChange={(syncUnanswered) => updateCalendarSettings({ syncUnanswered })}
        />
      </Section>
      <Text className="text-muted-foreground px-1 text-xs">
        {available
          ? 'Arrangementene legges i kalenderen du velger, og oppdateres når de endres. Svarer du «Kommer ikke», fjernes arrangementet.'
          : 'Kalender er ikke tilgjengelig i Expo Go. Det krever en development build.'}
      </Text>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className={cn('flex-row items-center gap-3 py-3', disabled && 'opacity-50')}>
      <Icon as={icon} size={18} />
      <View className="flex-1">
        <Text>{label}</Text>
        {description && <Text className="text-muted-foreground text-xs">{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: ACCENT }}
      />
    </View>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text className="text-muted-foreground px-1 text-sm font-medium">{children}</Text>;
}

function Section({ children }: { children: ReactNode }) {
  return <View className="bg-muted/60 rounded-2xl px-4">{children}</View>;
}
