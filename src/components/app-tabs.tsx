import { useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useUnreadCounts } from '@/data/hooks';

// Skjermer med skrivefelt nederst (kommentarer og chat). Der skjules fanelinjen, ellers ligger glass-linjen
// på iOS oppå feltet (samme mønster som Meldinger-appen).
const SCREENS_WITH_INPUT = ['kunngjoring', 'avstemning', '[conversationId]'];

// NativeTabs gir liquid glass på iOS 26 og Material 3-fanelinje på Android. Som i TIHLDE Native
// setter vi ingen farger: systemet tegner fanelinjen (systemblå valgt fane, røde merker), og
// den marineblå bakgrunnen skinner gjennom glasset. Linjen krymper når man scroller ned.
export default function AppTabs() {
  const { data: unread } = useUnreadCounts();
  const segments = useSegments() as string[];
  const hidden = segments.some((segment) => SCREENS_WITH_INPUT.includes(segment));

  return (
    <NativeTabs minimizeBehavior="onScrollDown" hidden={hidden}>
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
