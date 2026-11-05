// GIF-søk (rett mot Klipy) og favorittene brukeren har lagret (hos oss).

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { api } from '@/lib/api';
import { fetchGifs, type Gif } from '@/lib/klipy';

const FAVORITES_KEY = ['gif-favorites'];

/** Klipy vil ha en stabil id per bruker. De får en hash, ikke selve bruker-id-en. */
export const useKlipyCustomerId = (userId: string) =>
  useQuery({
    queryKey: ['klipy-customer', userId],
    queryFn: () => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, userId),
    staleTime: Infinity,
  }).data;

/** Trending når `query` er tom. Lang `staleTime` fordi testnøkler har 100 kall i timen. */
export const useGifs = (query: string, customerId: string | undefined, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ['klipy', query],
    queryFn: ({ pageParam }) => fetchGifs(query, pageParam, customerId!),
    initialPageParam: 1,
    getNextPageParam: (page) => page.nextPage,
    enabled: enabled && Boolean(customerId),
    staleTime: 10 * 60 * 1000,
  });

export const useFavoriteGifs = () =>
  useQuery({ queryKey: FAVORITES_KEY, queryFn: () => api<Gif[]>('/gifs/favorites') });

/** Legger til eller fjerner en favoritt. Vises med en gang og rulles tilbake hvis det feiler. */
export function useToggleFavoriteGif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gif, favorite }: { gif: Gif; favorite: boolean }) =>
      favorite
        ? api<Gif>('/gifs/favorites', { method: 'POST', body: gif })
        : api(`/gifs/favorites/${encodeURIComponent(gif.slug)}`, { method: 'DELETE' }),
    onMutate: async ({ gif, favorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<Gif[]>(FAVORITES_KEY);
      queryClient.setQueryData<Gif[]>(FAVORITES_KEY, (list = []) =>
        favorite ? [gif, ...list] : list.filter((g) => g.slug !== gif.slug)
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(FAVORITES_KEY, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
