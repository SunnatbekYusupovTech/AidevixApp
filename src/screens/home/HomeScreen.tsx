import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import AnimatedPressable from '../../components/common/AnimatedPressable';
import FadeInView from '../../components/common/FadeInView';
import { triggerHaptic } from '../../utils/haptics';
import GradientCard from '../../components/common/GradientCard';
import IconBadge from '../../components/common/IconBadge';
import ProgressBar from '../../components/common/ProgressBar';
import Screen from '../../components/common/Screen';
import SectionHeader from '../../components/common/SectionHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ActivityFeed from '../../components/home/ActivityFeed';
import AnimatedLogo from '../../components/home/AnimatedLogo';
import RoadmapsSection from '../../components/home/RoadmapsSection';
import CourseCard from '../../components/course/CourseCard';
import StreakCounter from '../../components/gamification/StreakCounter';
import QuizModal from '../../components/quiz/QuizModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTopCourses } from '../../store/slices/courseSlice';
import { useTheme } from '../../theme';

const HomeScreen = ({ navigation }: any) => {
  const { colors, spacing, radii, gradients, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { topCourses, loading } = useAppSelector((state) => state.course);
  const [refreshing, setRefreshing] = React.useState(false);
  const [quizVisible, setQuizVisible] = React.useState(false);

  useEffect(() => {
    dispatch(fetchTopCourses());
  }, [dispatch]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchTopCourses()).finally(() => setRefreshing(false));
  }, [dispatch]);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh} padded={false}>
      {/* ═══════════ HERO — Animated Logo ═══════════ */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.06)', 'transparent']
              : ['rgba(99,102,241,0.06)', 'rgba(139,92,246,0.03)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <FadeInView delay={0}>
          <AnimatedLogo />
        </FadeInView>
      </View>

      {/* ═══════════ USER WELCOME ROW ═══════════ */}
      <FadeInView delay={80}>
        <View style={[styles.userRow, { paddingHorizontal: spacing.xl, marginBottom: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcome, { color: colors.textSecondary }]}>Xush kelibsiz,</Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.firstName || "O'quvchi"} 👋
            </Text>
          </View>
          <AnimatedPressable
            onPress={() => navigation.navigate('Leaderboard')}
            style={[
              styles.streakPill,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
                borderRadius: radii.pill,
              },
            ]}
          >
            <StreakCounter count={user?.streak || 0} />
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : colors.border }]} />
            <View style={styles.xpBox}>
              <Ionicons name="flash" size={16} color={colors.accent} />
              <Text style={[styles.xpText, { color: colors.text }]}>{user?.xp || 0} XP</Text>
            </View>
          </AnimatedPressable>
        </View>
      </FadeInView>

      <GradientSep isDark={isDark} />

      {/* ═══════════ QUICK ACTIONS ═══════════ */}
      <FadeInView delay={140}>
        <View style={[styles.quickActions, { paddingHorizontal: spacing.xl }]}>
          <QuickAction name="code-slash" label="Editor" color={colors.primary} bg={isDark ? 'rgba(99,102,241,0.15)' : '#EEF0FF'} onPress={() => navigation.navigate('Playground')} />
          <QuickAction name="play-circle" label="Shorts" color={colors.secondary} bg={isDark ? 'rgba(6,182,212,0.15)' : '#E0F7FB'} onPress={() => navigation.navigate('Shorts')} />
          <QuickAction name="checkmark-done" label="Testlar" color={colors.success} bg={isDark ? 'rgba(34,211,153,0.15)' : '#E8FDF5'} onPress={() => setQuizVisible(true)} />
          <QuickAction name="people" label="Asoschilar" color={colors.accent} bg={isDark ? 'rgba(245,158,11,0.15)' : '#FEF3E2'} onPress={() => navigation.navigate('Founders')} />
        </View>
      </FadeInView>

      {/* Separator */}
      <GradientSep isDark={isDark} />

      {/* ═══════════ BATTLE ARENA BANNER ═══════════ */}
      <FadeInView delay={160}>
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              triggerHaptic('medium');
              navigation.navigate('BattleLobby');
            }}
          >
            <GradientCard variant="brand" glow style={styles.battleBanner}>
              <View style={styles.battleBannerLeft}>
                <View style={styles.battleBadge}>
                  <Text style={styles.battleBadgeText}>ARENA OCHIQ</Text>
                </View>
                <Text style={styles.battleBannerTitle}>KODING BATTLE ⚔️</Text>
                <Text style={styles.battleBannerSub}>
                  1v1, 2v2 va 4v4 tezkor duellar. Boshqalar bilan kuch sinashib, XP yuting!
                </Text>
              </View>
              <View style={styles.battleBannerRight}>
                <Ionicons name="flash" size={32} color="#FBBF24" />
              </View>
            </GradientCard>
          </TouchableOpacity>
        </View>
      </FadeInView>

      <GradientSep isDark={isDark} />

      {/* ═══════════ ROADMAPS ═══════════ */}
      <FadeInView delay={180}>
        <RoadmapsSection navigation={navigation} />
      </FadeInView>

      <GradientSep isDark={isDark} />

      {/* ═══════════ TODAY'S CHALLENGE ═══════════ */}
      <FadeInView delay={220}>
        <View style={[styles.section, { paddingHorizontal: spacing.xl }]}>
          <SectionHeader
            title="Bugungi Sinov"
            actionLabel="Hammasi"
            onActionPress={() => navigation.navigate('DailyChallenge')}
          />

          <GradientCard variant="brand" onPress={() => navigation.navigate('DailyChallenge')} style={styles.challengeCard}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>1ta dars ko'rish</Text>
              <Text style={styles.challengeReward}>+100 XP mukofot</Text>
              <ProgressBar progress={40} color="#fff" trackColor="rgba(255,255,255,0.25)" style={{ marginTop: spacing.md }} />
            </View>
            <Ionicons name="gift" size={44} color="rgba(255,255,255,0.45)" />
          </GradientCard>

          <GradientCard variant="accent" onPress={() => navigation.navigate('DailyChallenge')} style={[styles.challengeCard, { marginTop: spacing.md }]}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>Kamida 2ta dars ko'rish</Text>
              <Text style={styles.challengeReward}>+200 XP mukofot</Text>
              <ProgressBar progress={0} color="#fff" trackColor="rgba(255,255,255,0.25)" style={{ marginTop: spacing.md }} />
            </View>
            <Ionicons name="trophy" size={44} color="rgba(255,255,255,0.45)" />
          </GradientCard>
        </View>
      </FadeInView>

      <GradientSep isDark={isDark} />

      {/* ═══════════ POPULAR COURSES ═══════════ */}
      <FadeInView delay={280}>
        <View style={styles.section}>
          <View style={{ paddingHorizontal: spacing.xl }}>
            <SectionHeader
              title="Mashhur Kurslar"
              actionLabel="Barchasi"
              onActionPress={() => navigation.navigate('CoursesStack')}
            />
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
              <SkeletonLoader width={280} height={180} />
              <View style={{ width: 16 }} />
              <SkeletonLoader width={280} height={180} />
            </ScrollView>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={topCourses}
              renderItem={({ item }) => (
                <CourseCard
                  course={item}
                  horizontal
                  onPress={(id) => navigation.navigate('CoursesStack', { screen: 'CourseDetail', params: { courseId: id } })}
                />
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingHorizontal: spacing.xl }}
            />
          )}
        </View>
      </FadeInView>

      <FadeInView delay={340}>
        <ActivityFeed />
      </FadeInView>



      <QuizModal visible={quizVisible} onClose={() => setQuizVisible(false)} />
    </Screen>
  );
};

// ─── Quick Action button ────────────────────────────────────
const QuickAction = ({
  name,
  label,
  color,
  bg,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) => {
  const { colors, radii } = useTheme();
  return (
    <AnimatedPressable onPress={onPress} style={styles.actionItem}>
      <View style={[styles.actionIconWrap, { backgroundColor: bg, borderRadius: radii.lg }]}>
        <Ionicons name={name} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </AnimatedPressable>
  );
};

// ─── Gradient separator ─────────────────────────────────────
const GradientSep = ({ isDark }: { isDark: boolean }) => (
  <View style={styles.sepWrap}>
    <LinearGradient
      colors={['transparent', isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', 'transparent']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.sep}
    />
  </View>
);

const styles = StyleSheet.create({
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  welcome: { fontSize: 14 },
  name: { fontSize: 24, fontWeight: '800' },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  xpBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  xpText: { marginLeft: 4, fontWeight: '600', fontSize: 14 },
  divider: { width: 1, height: 15, marginHorizontal: 8 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: 68,
    gap: 8,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '500' },

  // Separator
  sepWrap: { paddingHorizontal: 40, marginVertical: 6 },
  sep: { height: 1 },

  // Section
  section: { marginBottom: 24 },
  challengeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: { flex: 1, marginRight: 20 },
  challengeTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  challengeReward: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 },

  // Battle Arena Banner
  battleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
  },
  battleBannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  battleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  battleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  battleBannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  battleBannerSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  battleBannerRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default HomeScreen;
