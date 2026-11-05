import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Check, Keyboard as KeyboardIcon, Search, Send, Smile, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  View,
  useWindowDimensions,
  type TextInput,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  ReduceMotion,
  ZoomIn,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EmojiGrid } from '@/components/sporty/emoji-grid';
import { EmptyState } from '@/components/sporty/empty-state';
import { GifGrid, GifGridLoading } from '@/components/sporty/gif-grid';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { useFavoriteGifs, useGifs, useKlipyCustomerId } from '@/data/gifs';
import { useEditMessage, useSendMessage } from '@/data/hooks';
import type { Message, User } from '@/data/types';
import { reportGifShare, type Gif } from '@/lib/klipy';

/** Hva skrivefeltet gjør i tillegg til å sende en ny melding. */
export type ComposerTarget = { mode: 'reply' | 'edit'; message: Message } | null;

type PanelTab = 'emoji' | 'gif' | 'favoritter';

const PANEL_TABS: { value: PanelTab; label: string }[] = [
  { value: 'emoji', label: 'Emoji' },
  { value: 'gif', label: 'GIF' },
  { value: 'favoritter', label: 'Favoritter' },
];

/** Avstanden mellom kapselen og det som ligger under den. */
const GAP = 8;
/** Høyden på kapselen med én linje tekst. */
const DOCK_HEIGHT = 56;
/** Høyden på panelet før tastaturet har vært oppe, så vi vet hvor høyt det er. */
const DEFAULT_PANEL_HEIGHT = 336;
/** Hvor mye av skjermen panelet tar når det er dratt opp. */
const TALL_PANEL_SHARE = 0.72;
/** Plassen header og kapsel trenger mens man søker, med tastaturet oppe. */
const RESERVED_WHILE_SEARCHING = 280;
const SEARCH_DEBOUNCE_MS = 400;
const TIMING = {
  duration: 280,
  easing: Easing.bezier(0.4, 0, 0.1, 1),
  reduceMotion: ReduceMotion.System,
};

/**
 * Plasseringen til den flytende kapselen og panelet under den. Panelet tar tastaturets plass: når
 * det åpnes med tastaturet oppe, settes det rett på samme høyde og tastaturet glir bort foran det.
 */
export function useComposerLayout(bottomInset: number) {
  const base = Math.max(bottomInset, 12);
  const { height: keyboard } = useReanimatedKeyboardAnimation();
  const { height: windowHeight } = useWindowDimensions();
  const panelHeight = useSharedValue(0);
  const dockHeight = useSharedValue(DOCK_HEIGHT);
  const searching = useSharedValue(false);
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);
  const keyboardHeight = useRef(DEFAULT_PANEL_HEIGHT);
  const searchFocused = useRef(false);

  useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeight.current = event.endCoordinates.height;
      // Tastaturet er oppe og dekker panelet, så det kan fjernes uten at noe flytter seg.
      if (searchFocused.current) return;
      panelHeight.set(0);
      setOpen(false);
      setTall(false);
    });
    return () => listener.remove();
  }, [panelHeight]);

  const openPanel = useCallback(() => {
    const height = keyboardHeight.current;
    setOpen(true);
    panelHeight.set(Keyboard.isVisible() ? height : withTiming(height, TIMING));
    Keyboard.dismiss();
  }, [panelHeight]);

  const closePanel = useCallback(() => {
    setTall(false);
    panelHeight.set(
      withTiming(0, TIMING, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(setOpen, false);
      })
    );
  }, [panelHeight]);

  const setPanelTall = useCallback(
    (value: boolean) => {
      setTall(value);
      const height = value ? windowHeight * TALL_PANEL_SHARE : keyboardHeight.current;
      panelHeight.set(withTiming(height, TIMING));
    },
    [panelHeight, windowHeight]
  );

  /** Når man søker, ligger panelet over tastaturet og må være lavere for å få plass. */
  const onSearchFocusChange = useCallback(
    (focused: boolean) => {
      searchFocused.current = focused;
      searching.set(focused);
      const height = keyboardHeight.current;
      const target = focused
        ? Math.max(200, windowHeight - height - RESERVED_WHILE_SEARCHING)
        : height;
      setTall(false);
      panelHeight.set(withTiming(target, TIMING));
    },
    [panelHeight, searching, windowHeight]
  );

  // Høyden fra bunnen av skjermen til undersiden av kapselen.
  const lift = useDerivedValue(() => {
    const keyboardOpen = Math.abs(keyboard.get());
    const panel = panelHeight.get();
    const panelTop = panel > 0 ? panel + (searching.get() ? keyboardOpen : 0) + GAP : 0;
    return Math.max(base, keyboardOpen + GAP, panelTop);
  });

  // Plassen under meldingene når ingenting er åpent. Den må ligge i selve listen: et innrykk flytter
  // ikke listen ved åpning, så den nyeste meldingen ville havnet bak kapselen.
  const restingPadding = DOCK_HEIGHT + base;
  // KeyboardChatScrollView løfter listen med tastaturhøyden minus denne.
  const keyboardOffset = Math.max(base - GAP, 0);

  // Det som mangler for at innholdet skal stå over kapselen, utover de to over.
  const extraContentPadding = useDerivedValue(() => {
    const fromKeyboard = Math.max(Math.abs(keyboard.get()) - keyboardOffset, 0);
    return Math.max(dockHeight.get() + lift.get() - restingPadding - fromKeyboard, 0);
  });

  const dockStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() }] }));
  const panelStyle = useAnimatedStyle(() => ({
    height: panelHeight.get(),
    bottom: searching.get() ? Math.abs(keyboard.get()) : 0,
  }));

  return {
    open,
    tall,
    openPanel,
    closePanel,
    setPanelTall,
    onSearchFocusChange,
    dockHeight,
    dockStyle,
    panelStyle,
    restingPadding,
    keyboardOffset,
    extraContentPadding,
  };
}

export type ComposerLayout = ReturnType<typeof useComposerLayout>;

/** Glass på iOS 26, ellers en fylt flate. */
function Surface({ children }: { children: ReactNode }) {
  return isLiquidGlassAvailable() ? (
    <GlassView style={{ borderRadius: 24 }} isInteractive>
      {children}
    </GlassView>
  ) : (
    <View className="bg-muted rounded-3xl">{children}</View>
  );
}

/** Kapselen som flyter over chatten, og panelet med emoji og GIF-er der tastaturet ellers er. */
export function ChatComposer({
  conversationId,
  me,
  text,
  setText,
  target,
  onCancel,
  layout,
}: {
  conversationId: string;
  me: User;
  text: string;
  setText: (text: string) => void;
  target: ComposerTarget;
  onCancel: () => void;
  layout: ComposerLayout;
}) {
  const inputRef = useRef<TextInput>(null);
  const send = useSendMessage(conversationId, me);
  const edit = useEditMessage(conversationId);
  const customerId = useKlipyCustomerId(me.id);
  const [tab, setTab] = useState<PanelTab>('emoji');
  const editing = target?.mode === 'edit';
  const canSend = text.trim().length > 0;

  // Åpne tastaturet når man velger å svare på eller redigere en melding.
  useEffect(() => {
    if (target) inputRef.current?.focus();
  }, [target]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    onCancel();
    if (editing) {
      edit.mutate(
        { messageId: target.message.id, body },
        { onError: (error) => Alert.alert('Meldingen ble ikke endret', error.message) }
      );
    } else {
      send.mutate(
        { body, replyTo: target?.mode === 'reply' ? target.message : null },
        {
          onError: (error) => {
            setText(body);
            Alert.alert('Meldingen ble ikke sendt', error.message);
          },
        }
      );
    }
  };

  const sendGif = (gif: Gif, query: string) => {
    const replyTo = target?.mode === 'reply' ? target.message : null;
    onCancel();
    layout.closePanel();
    send.mutate(
      { body: 'GIF', replyTo, gif },
      { onError: (error) => Alert.alert('GIF-en ble ikke sendt', error.message) }
    );
    if (customerId) reportGifShare(gif.slug, customerId, query);
  };

  return (
    <>
      {layout.open && (
        <Animated.View
          style={layout.panelStyle}
          className="bg-card absolute inset-x-0 overflow-hidden rounded-t-3xl">
          <PanelHandle tall={layout.tall} layout={layout} />
          <View className="px-3 pb-2">
            <Segmented options={PANEL_TABS} value={tab} onChange={setTab} />
          </View>
          {tab === 'emoji' ? (
            <EmojiGrid
              onSelect={(emoji) => setText(text + emoji)}
              onSearchFocusChange={layout.onSearchFocusChange}
            />
          ) : tab === 'gif' ? (
            <GifTab
              customerId={customerId}
              onSelect={sendGif}
              onSearchFocusChange={layout.onSearchFocusChange}
            />
          ) : (
            <FavoritesTab onSelect={(gif) => sendGif(gif, '')} />
          )}
        </Animated.View>
      )}

      <Animated.View
        style={layout.dockStyle}
        onLayout={(event) => layout.dockHeight.set(event.nativeEvent.layout.height)}
        className="absolute inset-x-3 bottom-0 gap-1.5">
        {target && (
          <Surface>
            <View className="flex-row items-center gap-2 px-4 py-2">
              <View className="flex-1">
                <Text className="text-brand text-xs font-semibold">
                  {editing
                    ? 'Redigerer meldingen'
                    : `Svarer ${target.message.sender.id === me.id ? 'deg selv' : target.message.sender.name}`}
                </Text>
                <Text className="text-muted-foreground text-[13px]" numberOfLines={1}>
                  {target.message.body}
                </Text>
              </View>
              <Pressable
                onPress={onCancel}
                hitSlop={8}
                accessibilityLabel={editing ? 'Avbryt redigering' : 'Avbryt svar'}
                className="active:opacity-70">
                <Icon as={X} size={18} className="text-muted-foreground" />
              </Pressable>
            </View>
          </Surface>
        )}
        <Surface>
          <View className="min-h-12 flex-row items-end gap-1 py-1 pl-3 pr-1">
            <Input
              ref={inputRef}
              className="h-auto max-h-32 min-h-10 flex-1 rounded-none border-0 bg-transparent px-1 py-2.5 shadow-none dark:bg-transparent"
              value={text}
              onChangeText={setText}
              placeholder="Skriv en melding"
              multiline
              maxLength={4000}
            />
            <Pressable
              onPress={() => (layout.open ? inputRef.current?.focus() : layout.openPanel())}
              hitSlop={6}
              accessibilityLabel={layout.open ? 'Vis tastatur' : 'Emoji og GIF'}
              className="size-10 items-center justify-center active:opacity-70">
              <Icon
                as={layout.open ? KeyboardIcon : Smile}
                size={22}
                className="text-muted-foreground"
              />
            </Pressable>
            {canSend && (
              <Animated.View entering={ZoomIn.duration(160).reduceMotion(ReduceMotion.System)}>
                <Pressable
                  onPress={submit}
                  hitSlop={8}
                  accessibilityLabel={editing ? 'Lagre' : 'Send'}
                  className="bg-brand size-10 items-center justify-center rounded-full active:opacity-70">
                  <Icon as={editing ? Check : Send} size={18} className="text-white" />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </Surface>
      </Animated.View>
    </>
  );
}

/** Dra opp for full høyde, dra ned for å lukke. Trykk bytter mellom høydene. */
function PanelHandle({ tall, layout }: { tall: boolean; layout: ComposerLayout }) {
  const startY = useRef(0);

  return (
    <View
      onTouchStart={(event) => {
        startY.current = event.nativeEvent.pageY;
      }}
      onTouchEnd={(event) => {
        const dy = event.nativeEvent.pageY - startY.current;
        if (dy < -24) layout.setPanelTall(true);
        else if (dy <= 24) layout.setPanelTall(!tall);
        else if (tall) layout.setPanelTall(false);
        else layout.closePanel();
      }}
      accessibilityRole="button"
      accessibilityLabel="Endre høyden på panelet"
      className="items-center py-2.5">
      <View className="bg-muted-foreground/40 h-1 w-9 rounded-full" />
    </View>
  );
}

function GifTab({
  customerId,
  onSelect,
  onSearchFocusChange,
}: {
  customerId: string | undefined;
  onSelect: (gif: Gif, query: string) => void;
  onSearchFocusChange: (focused: boolean) => void;
}) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const gifs = useGifs(query, customerId, true);

  // Vent til man har sluttet å skrive, så ikke hvert tastetrykk blir et kall til Klipy.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <>
      <View className="justify-center px-3 pb-2">
        <Input
          value={input}
          onChangeText={setInput}
          // Klipy krever denne teksten i søkefeltet.
          placeholder="Search KLIPY"
          autoCorrect={false}
          returnKeyType="search"
          className="rounded-full pl-9"
          onFocus={() => onSearchFocusChange(true)}
          onBlur={() => onSearchFocusChange(false)}
        />
        <View className="absolute left-6 top-0 h-10 justify-center" pointerEvents="none">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
      </View>
      {gifs.isPending ? (
        <GifGridLoading />
      ) : gifs.isError ? (
        <EmptyState text={gifs.error.message} />
      ) : (
        <GifGrid
          gifs={gifs.data.pages.flatMap((page) => page.gifs)}
          onSelect={(gif) => onSelect(gif, query)}
          onEndReached={() => gifs.hasNextPage && gifs.fetchNextPage()}
          loadingMore={gifs.isFetchingNextPage}
          emptyText={`Fant ingen GIF-er for «${query}»`}
        />
      )}
    </>
  );
}

function FavoritesTab({ onSelect }: { onSelect: (gif: Gif) => void }) {
  const favorites = useFavoriteGifs();

  if (favorites.isPending) return <GifGridLoading />;
  if (favorites.isError) return <EmptyState text={favorites.error.message} />;
  return (
    <GifGrid
      gifs={favorites.data}
      onSelect={onSelect}
      emptyText="Trykk på stjernen eller hold inne en GIF for å lagre den her"
    />
  );
}
