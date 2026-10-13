import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Bell, Ellipsis, Shield } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Group } from '@/data/types';
import { fileUrl } from '@/lib/api';

const HEADER_HEIGHT = 44;

/**
 * Toppbanner på gruppesiden (Spond-stil): forsidebildet hvis gruppen har et, ellers gruppefargen
 * med en stor dempet logo, og knapperad nederst.
 */
export function GroupBanner({ group, hasSubgroups }: { group: Group; hasSubgroups: boolean }) {
  const insets = useSafeAreaInsets();
  const manage = group.myRole === 'admin' || group.myRole === 'subadmin';

  return (
    <View
      className="overflow-hidden px-4 pb-4"
      style={{ backgroundColor: group.color, paddingTop: insets.top + HEADER_HEIGHT + 56 }}>
      {group.coverUrl ? (
        <>
          <Image
            source={{ uri: fileUrl(group.coverUrl) }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
          />
          {/* Mørk toning så tittel og knapper synes på lyse bilder. */}
          <View className="absolute inset-0 bg-black/35" />
        </>
      ) : (
        <View className="absolute -right-10 -top-6 opacity-20">
          <Icon as={Shield} size={260} className="text-white" fill="rgba(255,255,255,0.4)" />
        </View>
      )}

      <View className="flex-row flex-wrap items-center gap-2">
        <Link href={`/grupper/${group.id}/medlemmer`} asChild>
          <Chip label="Medlemmer" />
        </Link>
        {hasSubgroups && (
          <Link href={`/grupper/${group.id}/undergrupper`} asChild>
            <Chip label="Undergrupper" />
          </Link>
        )}
        <Link href={`/grupper/${group.id}/varsler`} asChild>
          <Chip icon={Bell} />
        </Link>
        {manage ? (
          // Sub-/admin: innstillinger for gruppen.
          <Link href={`/grupper/${group.id}/innstillinger`} asChild>
            <Chip icon={Ellipsis} />
          </Link>
        ) : (
          <Chip icon={Ellipsis} onPress={() => Alert.alert(group.name, group.description)} />
        )}
      </View>
    </View>
  );
}

function Chip({
  label,
  icon,
  ...props
}: {
  label?: string;
  icon?: typeof Bell;
} & React.ComponentProps<typeof Pressable>) {
  return (
    <Pressable
      className="h-10 min-w-10 flex-row items-center justify-center rounded-full bg-black/35 px-4 active:opacity-70"
      {...props}>
      {icon && <Icon as={icon} size={18} className="text-white" />}
      {label && <Text className="font-medium text-white">{label}</Text>}
    </Pressable>
  );
}
