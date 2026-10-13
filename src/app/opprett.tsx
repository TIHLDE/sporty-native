import { router, useLocalSearchParams, type Href } from 'expo-router';
import { BarChart3, CalendarPlus, ChevronRight, Megaphone, Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

/** (Sub-/admin) Hva kan opprettes fra ＋ på gruppesiden. Grupper opprettes kun på nettsiden. */
export default function OpprettScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const options: { icon: typeof Megaphone; title: string; subtitle: string; href: Href }[] = [
    {
      icon: CalendarPlus,
      title: 'Arrangement',
      subtitle: 'Trening, kamp eller sosialt med påmelding',
      href: { pathname: '/nytt-arrangement', params: { groupId } },
    },
    {
      icon: Megaphone,
      title: 'Kunngjøring',
      subtitle: 'Beskjed til alle, med bilder, video og vedlegg',
      href: { pathname: '/ny-kunngjoring', params: { groupId } },
    },
    {
      icon: BarChart3,
      title: 'Avstemning',
      subtitle: 'Spør gruppen og la medlemmene stemme',
      href: { pathname: '/ny-avstemning', params: { groupId } },
    },
    {
      icon: Wallet,
      title: 'Betaling',
      subtitle: 'Be medlemmene betale med Vipps',
      href: { pathname: '/ny-betaling', params: { groupId } },
    },
  ];

  return (
    <View className="px-4 pb-6 pt-6">
      <Text variant="h4" className="pb-2">
        Opprett
      </Text>
      {options.map((option, index) => (
        <View key={option.title}>
          {index > 0 && <Separator />}
          <Pressable
            // Bytt ut arket med skjemaet, så "Avbryt"/tilbake går rett til gruppesiden.
            onPress={() => router.replace(option.href)}
            className="flex-row items-center gap-3 py-3.5 active:opacity-70">
            <View className="bg-brand/15 size-10 items-center justify-center rounded-full">
              <Icon as={option.icon} size={20} className="text-brand" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold">{option.title}</Text>
              <Text className="text-muted-foreground text-sm">{option.subtitle}</Text>
            </View>
            <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
