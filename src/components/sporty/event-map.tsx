import { Navigation } from 'lucide-react-native';
import { Linking, Platform, Pressable, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Location } from '@/data/types';

const ZOOM = { latitudeDelta: 0.006, longitudeDelta: 0.006 };

/** Lite, ikke-interaktivt kart med en markør. Brukes som forhåndsvisning i skjemaer. */
export function MapPreview({ location, height = 140 }: { location: Location; height?: number }) {
  return (
    <MapView
      // Ny key når stedet endres, siden initialRegion bare leses første gang.
      key={`${location.latitude},${location.longitude}`}
      style={{ width: '100%', height }}
      initialRegion={{ latitude: location.latitude, longitude: location.longitude, ...ZOOM }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      pointerEvents="none">
      <Marker coordinate={location} />
    </MapView>
  );
}

function openInMaps({ name, latitude, longitude }: Location) {
  const label = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://?q=${label}&ll=${latitude},${longitude}`,
    default: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
  );
}

/** Kart over oppmøtestedet. Trykk åpner stedet i kartappen for veibeskrivelse. */
export function EventMap({ location }: { location: Location }) {
  return (
    <View className="bg-muted/60 overflow-hidden rounded-2xl">
      <Pressable onPress={() => openInMaps(location)}>
        <MapView
          style={{ width: '100%', height: 180 }}
          initialRegion={{ latitude: location.latitude, longitude: location.longitude, ...ZOOM }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          pointerEvents="none">
          <Marker coordinate={location} title={location.name} />
        </MapView>
      </Pressable>
      <Pressable
        onPress={() => openInMaps(location)}
        className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
        <Text className="flex-1 font-medium">{location.name}</Text>
        <Icon as={Navigation} size={16} className="text-brand" />
        <Text className="text-brand text-sm font-medium">Veibeskrivelse</Text>
      </Pressable>
    </View>
  );
}
