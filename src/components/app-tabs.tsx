import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { useUnreadCounts } from '@/data/hooks';
import { THEME } from '@/lib/theme';

// Skjermer med skrivefelt nederst (kommentarer og chat). Der skjules fanelinjen, ellers ligger glass-linjen
// på iOS oppå feltet (samme mønster som Meldinger-appen).
const SCREENS_WITH_INPUT = ['kunngjoring', 'avstemning', '[conversationId]'];

// NativeTabs gir liquid glass på iOS 26 og Material 3-fanelinje på Android. Valgt fane vises med
// fylt ikon i stedet for systemblått: hvit i mørk modus og svart i lys, så den alltid synes.
// Linjen blir stående med alle fanene når man scroller. iOS kan bare minimere den til én knapp,
// ikke gjøre den litt mindre.
export default function AppTabs() {
  const { data: unread } = useUnreadCounts();
  const segments = useSegments() as string[];
  const hidden = segments.some((segment) => SCREENS_WITH_INPUT.includes(segment));
  const tintColor = THEME[useColorScheme() === 'dark' ? 'dark' : 'light'].foreground;

  return (
    <NativeTabs minimizeBehavior="never" tintColor={tintColor} hidden={hidden}>
      <NativeTabs.Trigger name="(hjem)">
        <NativeTabs.Trigger.Label>Hjem</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="varsler">
        <NativeTabs.Trigger.Label>Varsler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bell', selected: 'bell.fill' }}
          md="notifications"
        />
        {!!unread?.notifications && (
          <NativeTabs.Trigger.Badge>{String(unread.notifications)}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="grupper">
        <NativeTabs.Trigger.Label>Grupper</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md="groups"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="meldinger">
        <NativeTabs.Trigger.Label>Meldinger</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }}
          md="chat"
        />
        {!!unread?.messages && (
          <NativeTabs.Trigger.Badge>{String(unread.messages)}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
