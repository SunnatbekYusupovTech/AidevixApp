import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView from '../../components/common/FadeInView';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchRanking,
  fetchWeeklyRanking,
  fetchUserPosition,
  setPeriod,
  setRefreshing,
  LeaderboardPeriod,
  RankingUser,
} from '../../store/slices/rankingSlice';
import { triggerHaptic } from '../../utils/haptics';
import SkeletonLoader from '../../components/common/SkeletonLoader';

interface NormalizedUser {
  id: string;
  rank: number;
  displayName: string;
  initial: string;
  avatar?: string;
  rankTitle: string;
  xp: number;
  isCurrent: boolean;
}

const MEDAL_COLORS = ['#fbbf24', '#cbd5e1', '#d97706'];

const normalize = (
  item: RankingUser,
  index: number,
  period: LeaderboardPeriod,
  currentUserId?: string
): NormalizedUser => {
  const nested = (item.user ?? {}) as any;
  const id = String(nested._id ?? (item as any)._id ?? nested.id ?? item.id ?? '');
  const firstName = nested.firstName ?? item.firstName ?? '';
  const lastName = nested.lastName ?? item.lastName ?? '';
  const username = nested.username ?? item.username ?? '';
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') || username || 'Foydalanuvchi';
  const initial = (displayName.trim()[0] || '?').toUpperCase();
  const avatar = nested.avatar ?? item.avatar;
  const rankTitle = nested.rankTitle ?? item.rankTitle ?? '';
  const xp =
    period === 'weekly'
      ? Number(nested.weeklyXp ?? item.weeklyXp ?? item.xp ?? 0)
      : Number(nested.xp ?? item.xp ?? 0);
  const rank = Number(item.rank ?? index + 1);
  const isCurrent = !!currentUserId && id === currentUserId;
  return { id: id || `row-${index}`, rank, displayName, initial, avatar, rankTitle, xp, isCurrent };
};

const LeaderboardScreen = () => {
  const { colors, gradients, spacing, typography, radii } = useTheme();
  const dispatch = useAppDispatch();
  const { users, weeklyUsers, period, loading, refreshing, error, currentUserPosition } =
    useAppSelector((state) => state.ranking);
  const currentUser = useAppSelector((state) => state.auth.user);

  const rawList = period === 'weekly' ? weeklyUsers : users;

  const list = useMemo(
    () => rawList.map((u, i) => {
      const norm = normalize(u, i, period, (currentUser as any)?._id || currentUser?.id);
      if (norm.isCurrent && currentUser?.avatar) {
        norm.avatar = currentUser.avatar;
      }
      return norm;
    }),
    [rawList, period, currentUser]
  );

  const loadData = useCallback(() => {
    if (period === 'weekly') {
      dispatch(fetchWeeklyRanking());
    } else {
      dispatch(fetchRanking({}));
    }
    if (currentUser?.id) {
      dispatch(fetchUserPosition(currentUser.id));
    }
  }, [dispatch, period, currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePeriodChange = (next: LeaderboardPeriod) => {
    if (next === period) return;
    triggerHaptic('light');
    dispatch(setPeriod(next));
  };

  const handleRefresh = () => {
    triggerHaptic('light');
    dispatch(setRefreshing(true));
    loadData();
  };

  const inListCurrentUser = list.find((u) => u.isCurrent);
  const showStickyPosition =
    !!currentUser && !inListCurrentUser && !!currentUserPosition?.rank;

  const renderItem: ListRenderItem<NormalizedUser> = ({ item, index }) => {
    const medalColor = item.rank >= 1 && item.rank <= 3 ? MEDAL_COLORS[item.rank - 1] : null;
    return (
      <FadeInView
        delay={Math.min(index, 10) * 50}
        style={[
          styles.row,
          {
            backgroundColor: item.isCurrent ? colors.primarySoft : colors.card,
            borderColor: item.isCurrent ? colors.primary : colors.border,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            borderRadius: radii.lg,
            borderWidth: item.isCurrent ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.rankWrap}>
          {medalColor ? (
            <View
              style={[
                styles.medal,
                { backgroundColor: medalColor + '25', borderColor: medalColor },
              ]}
            >
              <Text style={[styles.medalText, { color: medalColor }]}>{item.rank}</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.rankText,
                { color: colors.textSecondary, fontSize: typography.sizes.md },
              ]}
            >
              {item.rank}
            </Text>
          )}
        </View>

        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Text style={[styles.initial, { color: colors.primary }]}>{item.initial}</Text>
          </View>
        )}

        <View style={styles.userMeta}>
          <Text
            numberOfLines={1}
            style={[
              styles.userName,
              { color: colors.text, fontSize: typography.sizes.md },
            ]}
          >
            {item.displayName}
            {item.isCurrent ? (
              <Text style={{ color: colors.primary }}> · Siz</Text>
            ) : null}
          </Text>
          {!!item.rankTitle && (
            <Text
              numberOfLines={1}
              style={[
                styles.userRank,
                { color: colors.textSecondary, fontSize: typography.sizes.xs },
              ]}
            >
              {item.rankTitle}
            </Text>
          )}
        </View>

        <View style={styles.xpWrap}>
          <Text style={[styles.xpValue, { color: colors.primary }]}>{item.xp}</Text>
          <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP</Text>
        </View>
      </FadeInView>
    );
  };

  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ marginBottom: spacing.sm }}>
          <SkeletonLoader height={60} borderRadius={radii.lg} />
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return renderSkeleton();
    return (
      <View style={[styles.empty, { padding: spacing.xxl }]}>
        <Ionicons name="trophy-outline" size={56} color={colors.textSecondary} />
        <Text
          style={[
            styles.emptyText,
            { color: colors.text, marginTop: spacing.md, fontSize: typography.sizes.lg },
          ]}
        >
          {error || 'Hozircha reyting bo\'sh'}
        </Text>
        <Text
          style={[
            styles.emptySubtext,
            {
              color: colors.textSecondary,
              marginTop: spacing.xs,
              fontSize: typography.sizes.sm,
            },
          ]}
        >
          XP to'plang va birinchi qatorga chiqing
        </Text>
      </View>
    );
  };

  const PeriodTab = ({ label, value }: { label: string; value: LeaderboardPeriod }) => {
    const active = period === value;
    return (
      <Pressable
        onPress={() => handlePeriodChange(value)}
        style={[
          styles.tab,
          {
            backgroundColor: active ? colors.card : 'transparent',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <Text
          style={{
            color: active ? colors.primary : '#ffffff',
            fontWeight: active ? typography.weights.bold : typography.weights.medium,
            fontSize: typography.sizes.sm,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Ionicons name="trophy" size={28} color="#ffffff" />
          <Text
            style={[
              styles.title,
              { color: '#ffffff', fontSize: typography.sizes.xxl, marginLeft: spacing.sm },
            ]}
          >
            Reyting
          </Text>
        </View>

        <View
          style={[
            styles.tabs,
            { backgroundColor: 'rgba(255,255,255,0.18)', marginTop: spacing.lg },
          ]}
        >
          <PeriodTab label="Haftalik" value="weekly" />
          <PeriodTab label="Umumiy" value="allTime" />
        </View>
      </LinearGradient>

      <FlatList
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: showStickyPosition ? 96 : spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {showStickyPosition && currentUserPosition && (
        <View
          style={[
            styles.stickyPosition,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          {currentUser?.avatar ? (
            <Image
              source={{ uri: currentUser.avatar }}
              style={[styles.avatar, { width: 36, height: 36, borderRadius: 18 }]}
            />
          ) : (
            <View style={[styles.stickyAvatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.initial, { color: colors.primary }]}>
                {(currentUser?.firstName?.[0] || currentUser?.username?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userMeta}>
            <Text style={{ color: colors.text, fontWeight: typography.weights.semibold }}>
              Sizning o'rningiz
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>
              #{currentUserPosition.rank}
              {currentUserPosition.total ? ` / ${currentUserPosition.total}` : ''}
            </Text>
          </View>
          <Text style={[styles.xpValue, { color: colors.primary }]}>
            {period === 'weekly'
              ? currentUserPosition.weeklyXp ?? 0
              : currentUserPosition.xp ?? 0}{' '}
            XP
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  title: { fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  tab: { borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rankWrap: { width: 36, alignItems: 'center', marginRight: 8 },
  rankText: { fontWeight: '700' },
  medal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { fontWeight: '700', fontSize: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initial: { fontWeight: '700' },
  userMeta: { flex: 1, minWidth: 0 },
  userName: { fontWeight: '600' },
  userRank: { marginTop: 2 },
  xpWrap: { alignItems: 'flex-end', marginLeft: 8 },
  xpValue: { fontWeight: '700', fontSize: 16 },
  xpLabel: { fontSize: 10, marginTop: -2 },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyText: { fontWeight: '600', textAlign: 'center' },
  emptySubtext: { textAlign: 'center' },
  stickyPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  stickyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});

export default LeaderboardScreen;
