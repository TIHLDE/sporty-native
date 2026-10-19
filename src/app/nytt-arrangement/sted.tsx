import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Search } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, View } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useEventDraft } from '@/data/event-draft';
import { usePlaceSearch, usePlaces } from '@/data/hooks';
import type { Place } from '@/data/types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

/**
 * Velg sted: lagrede steder (gruppens nylig brukte + felles forslag) vises med en gang,
 * og søk i kart (OpenStreetMap) når man skriver minst tre tegn.
 */
export default function VelgStedScreen() {
  const { forGroupId } = useLocalSearchParams<{ forGroupId: string }>();
  const { update } = useEventDraft();
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim());

  const saved = usePlaces(forGroupId, q);
  const search = usePlaceSearch(q);

  const choose = (place: Place) => {
    update({
      location: { name: place.name, latitude: place.latitude, longitude: place.longitude },
    });
    router.back();
  };

  const sections = [
    { key: 'saved', title: q ? 'Lagrede steder' : 'Forslag', data: saved.data ?? [] },
    ...(q.length >= 3 ? [{ key: 'search', title: 'Søk i kart', data: search.data ?? [] }] : []),
  ].filter((section) => section.data.length > 0 || section.key === 'search');

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-4 pb-12"
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      sections={sections}
      keyExtractor={(place, index) => `${place.id ?? 'search'}-${index}`}
      ListHeaderComponent={
        <View className="py-3">
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Søk etter sted eller adresse"
            autoFocus
            returnKeyType="search"
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View className="flex-row items-center gap-2 pb-1 pt-4">
          <Text className="text-muted-foreground text-sm font-medium">{section.title}</Text>
          {section.key === 'search' && search.isFetching && <ActivityIndicator size="small" />}
        </View>
      )}
      renderSectionFooter={({ section }) =>
        section.key === 'search' && !search.isFetching && section.data.length === 0 ? (
          <Text className="text-muted-foreground py-3 text-sm">
            {search.isError ? 'Søket feilet, prøv igjen' : 'Ingen treff i kartet'}
          </Text>
        ) : null
      }
      ItemSeparatorComponent={() => <Separator />}
      ListEmptyComponent={
        saved.isPending ? (
          <ActivityIndicator className="py-10" />
        ) : (
          <EmptyState text="Ingen steder" />
        )
      }
      renderItem={({ item, section }) => (
        <Pressable
          onPress={() => choose(item)}
          className="flex-row items-center gap-3 py-3 active:opacity-70">
          <View className="bg-muted size-9 items-center justify-center rounded-full">
            <Icon as={section.key === 'search' ? Search : MapPin} size={16} />
          </View>
          <View className="flex-1">
            <Text className="font-medium">{item.name}</Text>
            {item.address ? (
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {item.address}
              </Text>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}
