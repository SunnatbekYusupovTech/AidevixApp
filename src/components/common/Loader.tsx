import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import AnimatedLogo from '../home/AnimatedLogo';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

// 3 ta nuqta pulsatsiya qiluvchi loader
const PulseDot = ({
  color,
  delay,
  dotSize,
}: {
  color: string;
  delay: number;
  dotSize: number;
}) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 500, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.4, { duration: 500 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: dotSize * 0.3,
        },
        animStyle,
      ]}
    />
  );
};


const Loader = ({ fullScreen, size = 'large', color, style }: LoaderProps) => {
  const { colors } = useTheme();
  const dotColor = color || colors.primary;
  const dotSize = size === 'large' ? 14 : 8;

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: colors.background },
          style,
        ]}
      >
        {/* Premium brand logo animatsiyasi */}
        <AnimatedLogo flat />
        {/* Tagida kichik pulsing nuqtalar */}
        <View style={[styles.dotsRow, { marginTop: 8 }]}>
          <PulseDot color={dotColor} delay={0} dotSize={6} />
          <PulseDot color={dotColor} delay={160} dotSize={6} />
          <PulseDot color={dotColor} delay={320} dotSize={6} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotsRow}>
        <PulseDot color={dotColor} delay={0} dotSize={dotSize} />
        <PulseDot color={dotColor} delay={160} dotSize={dotSize} />
        <PulseDot color={dotColor} delay={320} dotSize={dotSize} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Loader;
 