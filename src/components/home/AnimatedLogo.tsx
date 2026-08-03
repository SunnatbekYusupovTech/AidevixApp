import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const BRAND = 'Aidevix';
const LETTERS = BRAND.split('');
const LETTER_DELAY = 100;
const TAGLINE = 'Kodlash sayohatingiz shu yerdan boshlanadi';

/**
 * Premium "Aidevix" logotipi — harf-harf animatsiya bilan.
 */
const AnimatedLogo = ({ flat = false }: { flat?: boolean }) => {
  const { colors, gradients, isDark } = useTheme();

  // Glow pulse
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    const timer = setTimeout(() => {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, LETTERS.length * LETTER_DELAY + 500);
    return () => clearTimeout(timer);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(12);

  useEffect(() => {
    const delay = LETTERS.length * LETTER_DELAY + 400;
    taglineOpacity.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    taglineY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const letterColor = isDark ? '#A5B4FC' : gradients.brand[0];

  return (
    <View style={flat ? styles.flatContainer : styles.container}>
      {/* Gradient orqa fon (faqat flat bo'lmasa) */}
      {!flat && (
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99,102,241,0.1)', 'transparent', 'rgba(139,92,246,0.06)']
              : ['rgba(99,102,241,0.05)', 'transparent', 'rgba(139,92,246,0.03)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Glow orb */}
      <Animated.View
        style={[
          styles.glowOrb,
          { backgroundColor: gradients.brand[0] },
          glowStyle,
        ]}
      />

      {/* Harflar */}
      <View style={styles.lettersRow}>
        {LETTERS.map((letter, index) => (
          <AnimatedLetter
            key={index}
            letter={letter}
            index={index}
            color={letterColor}
          />
        ))}
      </View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { color: colors.textSecondary }, taglineStyle]}>
        {TAGLINE}
      </Animated.Text>
    </View>
  );
};

// ─── Har bir harf ──────────────────────────────────────────
const AnimatedLetter = ({
  letter,
  index,
  color,
}: {
  letter: string;
  index: number;
  color: string;
}) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * LETTER_DELAY;

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) })
    );

    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 9,
        stiffness: 200,
        mass: 0.7,
      })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: (1 - opacity.value) * -15 },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.letter,
        {
          color,
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 14,
        },
        animStyle,
      ]}
    >
      {letter}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 28,
    paddingTop: 16,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    marginBottom: 8,
  },
  flatContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 28,
    position: 'relative',
  },
  glowOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -40,
    alignSelf: 'center',
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 44,
    fontWeight: '900',
    marginHorizontal: 4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

export default AnimatedLogo;
