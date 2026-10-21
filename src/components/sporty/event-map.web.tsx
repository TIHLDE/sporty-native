import { Navigation } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Location } from '@/data/types';
import { locationLines } from '@/lib/events';

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
      <LocationText location={location} />
      <Icon as={Navigation} size={16} className="text-brand" />
      <Text className="text-brand text-sm font-medium">Åpne i kart</Text>
    </Pressable>
  );
}

/** Navnet på stedet, med adressen under hvis stedet har et eget navn. */
function LocationText({ location }: { location: Location }) {
  const { title, address } = locationLines(location);
  return (
    <View className="flex-1">
      <Text className="font-medium">{title}</Text>
      {address && <Text className="text-muted-foreground text-sm">{address}</Text>}
    </View>
  );
}
