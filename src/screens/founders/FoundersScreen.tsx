import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import FadeInView from '../../components/common/FadeInView';
import { triggerHaptic } from '../../utils/haptics';
import { FOUNDERS, Founder } from '../../data/founders';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 ustunli grid (padding 16 va o'rtadagi bo'shliq 16)
const CARD_HEIGHT = 220;

const AVATAR_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
];

// Rasm yuklanmasa ko'rsatiladigan avatar
const CardImage = ({
  uri,
  name,
  index,
}: {
  uri: string;
  name: string;
  index: number;
}) => {
  const [failed, setFailed] = useState(false);
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = name.trim().charAt(0).toUpperCase();

  if (failed) {
    return (
      <View style={[styles.cardImage, { backgroundColor: bg }]}>
        <Text style={styles.placeholderText}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={styles.cardImage}
      resizeMode="cover"
    />
  );
};

// 3D Flip Card komponenti
const FlipCard = ({ founder, index }: { founder: Founder; index: number }) => {
  const { colors, radii, isDark } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const handlePress = () => {
    triggerHaptic('light');
    setIsFlipped(!isFlipped);
    rotateY.value = withSpring(isFlipped ? 0 : 180, {
      damping: 14,
      stiffness: 90,
    });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const opacity = rotateY.value > 90 ? 0 : 1;
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY.value}deg` },
      ],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const opacity = rotateY.value > 90 ? 1 : 0;
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY.value - 180}deg` },
      ],
      opacity,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      style={[styles.cardContainer, { marginBottom: 16 }]}
    >
      {/* FRONT SIDE (Rasm + Ism) */}
      <Animated.View
        style={[
          styles.cardSide,
          {
            backgroundColor: colors.card,
            borderColor: founder.lead ? colors.primary : colors.border,
            borderRadius: radii.xl,
          },
          frontAnimatedStyle,
        ]}
      >
        <CardImage uri={founder.image} name={founder.name} index={index} />
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.95)']}
          style={styles.gradientOverlay}
        />
        <View style={styles.frontTextContainer}>
          <Text style={styles.frontName}>{founder.name}</Text>
          <Text style={styles.frontRole}>{founder.role.split('·')[0]}</Text>
        </View>
        {founder.lead && (
          <View style={[styles.leadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.leadText}>CEO</Text>
          </View>
        )}
      </Animated.View>

      {/* BACK SIDE (Batafsil ma'lumot) */}
      <Animated.View
        style={[
          styles.cardSide,
          styles.cardBack,
          {
            backgroundColor: isDark ? '#0f172a' : colors.card,
            borderColor: colors.primary,
            borderRadius: radii.xl,
          },
          backAnimatedStyle,
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.backContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.backName, { color: colors.text }]}>
            {founder.name}
          </Text>
          {founder.age && (
            <Text style={[styles.backAge, { color: colors.textSecondary }]}>
              {founder.age} yosh
            </Text>
          )}

          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: founder.lead ? colors.primary : colors.primarySoft,
                borderRadius: radii.pill,
              },
            ]}
          >
            <Text
              style={[
                styles.roleText,
                { color: founder.lead ? '#ffffff' : colors.primary },
              ]}
            >
              {founder.role}
            </Text>
          </View>

          <Text style={[styles.backTask, { color: colors.textSecondary }]}>
            {founder.task}
          </Text>
        </ScrollView>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Asosiy Screen
const FoundersScreen = () => {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            navigation.goBack();
          }}
          hitSlop={10}
          style={[
            styles.backBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontSize: typography.sizes.xxl },
          ]}
        >
          Asoschilar
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.subheader,
            { color: colors.textSecondary, fontSize: typography.sizes.sm },
          ]}
        >
          Aidevix platformasini yaratgan yosh dasturchilar jamoasi — har biri
          loyihaning muhim qismlariga mas'ul.
        </Text>

        {/* 2 ustunli premium grid */}
        <View style={styles.grid}>
          {FOUNDERS.map((founder, index) => (
            <FadeInView key={founder.id} delay={index * 60}>
              <FlipCard founder={founder} index={index} />
            </FadeInView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '900',
    marginLeft: 12,
  },
  scrollContent: {
    paddingTop: 12,
  },
  subheader: {
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardSide: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardFront: {
    position: 'relative',
  },
  cardBack: {
    borderWidth: 1.5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  frontTextContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  frontName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  frontRole: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  leadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  leadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  backContent: {
    padding: 14,
    flexGrow: 1,
  },
  backName: {
    fontSize: 16,
    fontWeight: '900',
  },
  backAge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  backTask: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});

export default FoundersScreen;
