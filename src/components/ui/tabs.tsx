import { TextClassContext } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@rn-primitives/tabs';
import * as React from 'react';
import { Platform, ScrollView, View, useColorScheme } from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Samme kurve som streken på nettsiden (`spring.selection` i Animate UI). `mass` må settes, for
 * Reanimated har 4 som standard (Motion har 1), og da spretter streken. Klemmingen låser den på
 * målet.
 */
const INDICATOR_SPRING = {
  stiffness: 300,
  damping: 30,
  mass: 1,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
};
const LABEL_TIMING = { duration: 200, reduceMotion: ReduceMotion.System };
const PANEL_DURATION = 250;
const LINE_LIST_PADDING = 16;

type TabLayout = { x: number; width: number };

/**
 * Glidende markering under den valgte fanen, for både streken og pillen. Første gang settes den
 * rett på plass, så den ikke glir inn fra venstre.
 */
function useTabIndicator(layout: TabLayout | undefined) {
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const positioned = React.useRef(false);
  const targetX = layout?.x;
  const targetWidth = layout?.width;

  React.useEffect(() => {
    if (targetX === undefined || targetWidth === undefined) return;
    const animate = positioned.current;
    x.set(animate ? withSpring(targetX, INDICATOR_SPRING) : targetX);
    width.set(animate ? withSpring(targetWidth, INDICATOR_SPRING) : targetWidth);
    positioned.current = true;
  }, [targetX, targetWidth, x, width]);

  return useAnimatedStyle(() => ({
    width: width.get(),
    transform: [{ translateX: x.get() }],
  }));
}

/** Lar fanene i `variant="line"` melde fra om plasseringen sin, så streken vet hvor den skal. */
const LineTabsContext = React.createContext<((tab: string, layout: TabLayout) => void) | null>(
  null
);

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} {...props} />;
}

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: 'default' | 'line' }) {
  if (variant === 'line') return <LineTabsList className={className} {...props} />;

  return (
    <TabsPrimitive.List
      className={cn(
        'bg-muted flex h-9 flex-row items-center justify-center rounded-lg p-[3px]',
        Platform.select({ web: 'inline-flex w-fit', native: 'mr-auto' }),
        className
      )}
      {...props}
    />
  );
}

/**
 * Vannrett fanerad med en strek under den aktive fanen. Streken glir mellom fanene, og raden
 * scroller selv den aktive fanen inn i bildet. Samme uttrykk som `variant="line"` på nettsiden.
 */
function LineTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const { value } = TabsPrimitive.useRootContext();
  const scrollRef = React.useRef<ScrollView>(null);
  const [layouts, setLayouts] = React.useState<Record<string, TabLayout>>({});
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [contentWidth, setContentWidth] = React.useState(0);

  const register = React.useCallback((tab: string, layout: TabLayout) => {
    setLayouts((current) => {
      const known = current[tab];
      if (known?.x === layout.x && known.width === layout.width) return current;
      return { ...current, [tab]: layout };
    });
  }, []);

  const activeX = layouts[value]?.x;
  const activeWidth = layouts[value]?.width;

  React.useEffect(() => {
    if (activeX === undefined || activeWidth === undefined || viewportWidth === 0) return;
    const centered = LINE_LIST_PADDING + activeX + activeWidth / 2 - viewportWidth / 2;
    const end = Math.max(0, contentWidth - viewportWidth);
    scrollRef.current?.scrollTo({ x: Math.min(Math.max(0, centered), end), animated: true });
  }, [activeX, activeWidth, viewportWidth, contentWidth]);

  const indicatorStyle = useTabIndicator(layouts[value]);

  return (
    <View className={cn('bg-background border-border border-b', className)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        // Ellers tar denne raden over «trykk på statuslinjen for å gå til toppen».
        scrollsToTop={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: LINE_LIST_PADDING }}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}>
        <LineTabsContext.Provider value={register}>
          <TabsPrimitive.List className="flex-row gap-4" {...props}>
            {children}
            <Animated.View
              pointerEvents="none"
              className="bg-foreground absolute bottom-0 left-0 h-0.5 rounded-full"
              style={indicatorStyle}
            />
          </TabsPrimitive.List>
        </LineTabsContext.Provider>
      </ScrollView>
    </View>
  );
}

/** Teksten i en fane. Fargen tones, så byttet følger markeringen i stedet for å hoppe. */
function TabLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { mutedForeground, foreground } = THEME[scheme];
  const progress = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    progress.set(withTiming(active ? 1 : 0, LABEL_TIMING));
  }, [active, progress]);

  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [mutedForeground, foreground]),
  }));

  return (
    <Animated.Text style={[{ fontSize: 14, lineHeight: 20, fontWeight: '500' }, colorStyle]}>
      {children}
    </Animated.Text>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value } = TabsPrimitive.useRootContext();
  const registerLineTab = React.useContext(LineTabsContext);

  if (registerLineTab) {
    const { children, onLayout, ...rest } = props;
    return (
      <TabsPrimitive.Trigger
        // Fanene står tett, så trykkflaten strekker seg ut i mellomrommet mellom dem.
        hitSlop={{ left: 8, right: 8 }}
        className={cn(
          'h-11 flex-row items-center justify-center',
          Platform.select({ web: 'cursor-default whitespace-nowrap' }),
          props.disabled && 'opacity-50',
          className
        )}
        onLayout={(event) => {
          const { x, width } = event.nativeEvent.layout;
          registerLineTab(props.value, { x, width });
          onLayout?.(event);
        }}
        {...rest}>
        <TabLabel active={value === props.value}>
          {children as React.ReactNode}
        </TabLabel>
      </TabsPrimitive.Trigger>
    );
  }

  return (
    <TextClassContext.Provider
      value={cn(
        'text-foreground dark:text-muted-foreground text-sm font-medium',
        value === props.value && 'dark:text-foreground'
      )}>
      <TabsPrimitive.Trigger
        className={cn(
          'flex h-[calc(100%-1px)] flex-row items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 shadow-none shadow-black/5',
          Platform.select({
            web: 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex cursor-default whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
          }),
          props.disabled && 'opacity-50',
          props.value === value && 'bg-background dark:border-foreground/10 dark:bg-input/30',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(Platform.select({ web: 'flex-1 outline-none' }), className)}
      {...props}
    />
  );
}

/** 1 = bytte mot høyre, -1 = mot venstre, 0 = ingen bytte ennå (ingen animasjon ved åpning). */
type TabDirection = -1 | 0 | 1;

function getTabDirection(order: string[], from: string, to: string): TabDirection {
  return order.indexOf(to) > order.indexOf(from) ? 1 : -1;
}

/** Innholdet i en fane. Tones inn fra den siden man bytter mot. Legges inni `TabsContent`. */
function TabPanel({
  direction,
  children,
}: {
  direction: TabDirection;
  children: React.ReactNode;
}) {
  const entering =
    direction === 0
      ? undefined
      : (direction > 0 ? FadeInRight : FadeInLeft)
          .duration(PANEL_DURATION)
          .reduceMotion(ReduceMotion.System);

  return <Animated.View entering={entering}>{children}</Animated.View>;
}

export {
  TabLabel,
  TabPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  getTabDirection,
  useTabIndicator,
  type TabDirection,
};
