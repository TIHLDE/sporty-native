import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

const reduceMotion = ReduceMotion.System;
const LOGO_EASING = Easing.bezier(0.7, 0, 0.3, 1);
const LOGO_PULL_BACK = { duration: 117, easing: LOGO_EASING, reduceMotion };
const LOGO_ZOOM = { duration: 533, easing: LOGO_EASING, reduceMotion };
const OVERLAY_FADE = { duration: 300, reduceMotion };
const APP_SETTLE = { duration: 700, easing: Easing.bezier(0.4, 0, 0.1, 1), reduceMotion };

/** Appen starter litt større og synker på plass mens logoen zoomer forbi. */
export const APP_ENTRANCE_SCALE = 1.08;

/**
 * Overgangen fra den native splash-skjermen: logoen trekker seg litt sammen, zoomer mot brukeren og
 * åpner appen. `appScale` styrer appen bak, se `APP_ENTRANCE_SCALE`.
 */
export function AnimatedSplashOverlay({ appScale }: { appScale: SharedValue<number> }) {
  const [visible, setVisible] = useState(true);
  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const logoScale = useSharedValue(1);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.get() }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.get(),
    transform: [{ scale: logoScale.get() }],
  }));

  function animateOut() {
    logoScale.set(
      withSequence(
        withTiming(0.9, LOGO_PULL_BACK),
        withTiming(9, LOGO_ZOOM, (finished) => {
          'worklet';
          if (finished) {
            scheduleOnRN(setVisible, false);
          }
        })
      )
    );
    logoOpacity.set(withDelay(LOGO_PULL_BACK.duration, withTiming(0, LOGO_ZOOM)));
    overlayOpacity.set(withDelay(300, withTiming(0, OVERLAY_FADE)));
    appScale.set(withDelay(150, withTiming(1, APP_SETTLE)));
  }

  if (!visible) return null;

  return (
    <Animated.View
      // Samme bilde, størrelse og farge som den native splash-skjermen (expo-splash-screen i
      // app.json), så overgangen ikke synes.
      onLayout={() => {
        SplashScreen.hideAsync().finally(animateOut);
      }}
      style={[styles.splashOverlay, overlayStyle]}>
      <Animated.View style={logoStyle}>
        <Image style={styles.splashImage} source={require('@/assets/images/splash-icon.png')} />
      </Animated.View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashImage: {
    width: 200,
    height: 200,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#5B2C98',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
