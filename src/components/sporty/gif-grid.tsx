import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View, useWindowDimensions } from 'react-native';

import { EmptyState } from '@/components/sporty/empty-state';
import { Icon } from '@/components/ui/icon';
import { useFavoriteGifs, useToggleFavoriteGif } from '@/data/gifs';
import type { Gif } from '@/lib/klipy';

const GAP = 6;
const SIDE_PADDING = 12;
const TILE_HEIGHT = 112;

/**
 * Rutenett med GIF-er i rekkefølgen de kommer. Trykk sender GIF-en. Stjernen, eller å holde inne,
 * lagrer den i favorittene.
 */
export function GifGrid({
  gifs,
  onSelect,
  onEndReached,
  loadingMore = false,
  emptyText,
}: {
  gifs: Gif[];
  onSelect: (gif: Gif) => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  emptyText: string;
}) {
  const { width } = useWindowDimensions();
  const favorites = useFavoriteGifs();
  const { mutate: toggle } = useToggleFavoriteGif();
  const saved = new Set(favorites.data?.map((g) => g.slug));
  const tileWidth = (width - SIDE_PADDING * 2 - GAP) / 2;

  return (
    <FlatList
      data={gifs}
      numColumns={2}
      keyExtractor={(gif) => gif.slug}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, paddingBottom: 16, gap: GAP }}
      columnWrapperStyle={{ gap: GAP }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState text={emptyText} />}
      ListFooterComponent={loadingMore ? <ActivityIndicator className="py-3" /> : null}
      renderItem={({ item }) => {
        const favorite = saved.has(item.slug);
        return (
          <Pressable
            onPress={() => onSelect(item)}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggle({ gif: item, favorite: !favorite });
            }}
            accessibilityLabel={item.title || 'GIF'}
            accessibilityHint="Trykk for å sende, hold inne for å lagre i favoritter"
            className="active:opacity-80">
            <Image
              source={{ uri: item.url }}
              style={{ width: tileWidth, height: TILE_HEIGHT, borderRadius: 10 }}
              contentFit="cover"
              recyclingKey={item.slug}
            />
            <Pressable
              onPress={() => toggle({ gif: item, favorite: !favorite })}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
              className="absolute right-1 top-1 size-7 items-center justify-center rounded-full bg-black/50">
              <Icon
                as={Star}
                size={15}
                className={favorite ? 'text-yellow-400' : 'text-white'}
                fill={favorite ? 'currentColor' : 'transparent'}
              />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

/** Plassholder mens første side med GIF-er lastes. */
export function GifGridLoading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
}
