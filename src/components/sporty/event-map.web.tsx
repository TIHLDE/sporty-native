import { Navigation } from 'lucide-react-native';
import { Linking, Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Location } from '@/data/types';

/** Ingen kart på web (react-native-maps støtter ikke web). */
export function MapPreview(_props: { location: Location; height?: number }) {
  return null;
}

/** react-native-maps støtter ikke web, så her vises bare en lenke til Google Maps. */
export function EventMap({ location }: { location: Location }) {
  return (
    <Pressable
      onPress={() =>
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
        )
      }
      className="bg-muted/60 flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-70">
      <Text className="flex-1 font-medium">{location.name}</Text>
      <Icon as={Navigation} size={16} className="text-brand" />
      <Text className="text-brand text-sm font-medium">Åpne i kart</Text>
    </Pressable>
  );
}
