import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { shadow, useTheme } from '../../theme';
import AnimatedPressable from './AnimatedPressable';

interface GlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  /** shaffoflik darajasi 0-1. Default: 0.12 */
  opacity?: number;
  /** border ko'rsatish. Default: true */
  bordered?: boolean;
  /** glow soya. Default: false */
  glow?: boolean;
}

/**
 * Glassmorphism karta — shaffof fon + nozik border + soya.
 * Dark/Light mode'ga moslashgan premium ko'rinish.
 */
const GlassCard = ({
  children,
  onPress,
  style,
  opacity = 0.12,
  bordered = true,
  glow = false,
}: GlassCardProps) => {
  const { colors, radii, isDark } = useTheme();

  const bgColor = isDark
    ? `rgba(255,255,255,${opacity})`
    : `rgba(255,255,255,${Math.min(opacity * 5, 0.85)})`;

  const borderColor = isDark
    ? `rgba(255,255,255,${opacity * 0.8})`
    : `rgba(0,0,0,${opacity * 0.4})`;

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: bgColor,
      borderRadius: radii.xl,
      borderWidth: bordered ? 1 : 0,
      borderColor,
    },
    glow ? shadow('glow', colors.primary) : shadow('sm', colors.shadow),
    style as ViewStyle,
  ];

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={cardStyle as any}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    overflow: 'hidden',
  },
});

export default GlassCard;
