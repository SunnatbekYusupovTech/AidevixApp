import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../store/hooks';
import { triggerHaptic } from '../../utils/haptics';
import GradientCard from '../../components/common/GradientCard';
import Screen from '../../components/common/Screen';

type Mode = '1v1' | '2v2' | '4v4';

const BattleLobbyScreen = () => {
  const { colors, spacing, typography, radii } = useTheme();
  const navigation = useNavigation<any>();
  const user = useAppSelector((state) => state.auth.user);
  const [selectedMode, setSelectedMode] = useState<Mode>('1v1');

  const startMatching = () => {
    triggerHaptic('medium');
    navigation.navigate('BattleMatching', { mode: selectedMode });
  };

  const selectMode = (mode: Mode) => {
    triggerHaptic('light');
    setSelectedMode(mode);
  };

  const getModeLabel = (mode: Mode) => {
    switch (mode) {
      case '1v1': return '1vs1 Duel';
      case '2v2': return '2vs2 Duo Brawl';
      case '4v4': return '4vs4 Squad Battle';
    }
  };

  const getModeDesc = (mode: Mode) => {
    switch (mode) {
      case '1v1': return 'Tezkor duel. 1 ta raqib bilan koding jang.';
      case '2v2': return 'Jamoaviy bellashuv. Do\'stingiz bilan 2ga 2 jang.';
      case '4v4': return 'Keng ko\'lamli guruh jangi. 4ga 4 jamoaviy to\'qnashuv.';
    }
  };

  const getModeReward = (mode: Mode) => {
    switch (mode) {
      case '1v1': return '+50 XP';
      case '2v2': return '+75 XP';
      case '4v4': return '+100 XP';
    }
  };

  const getModeIcon = (mode: Mode) => {
    switch (mode) {
      case '1v1': return 'flash-outline';
      case '2v2': return 'people-outline';
      case '4v4': return 'shield-half-outline';
    }
  };

  return (
    <Screen padded={false}>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              navigation.goBack();
            }}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl, marginLeft: spacing.md }]}>
            Battle Arena ⚔️
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.huge }} showsVerticalScrollIndicator={false}>
          {/* User Stats Card */}
          <GradientCard variant="brand" style={[styles.statsCard, { marginBottom: spacing.xl }]}>
            <View style={styles.statsCardLeft}>
              <Text style={styles.rankTitle}>{user?.rankTitle || 'AMATEUR'}</Text>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.userXp}>{user?.xp?.toLocaleString() || 0} XP</Text>
            </View>
            <View style={styles.statsCardRight}>
              <Ionicons name="trophy" size={54} color="rgba(255, 255, 255, 0.3)" />
            </View>
          </GradientCard>

          {/* Mode Select Header */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Jang formatini tanlang
          </Text>

          {/* Modes List */}
          <View style={styles.modesContainer}>
            {(['1v1', '2v2', '4v4'] as Mode[]).map((mode) => {
              const active = selectedMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.85}
                  onPress={() => selectMode(mode)}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: radii.lg,
                      padding: spacing.lg,
                    },
                    active && styles.activeModeCard,
                  ]}
                >
                  <View style={[styles.modeIconWrap, { backgroundColor: active ? colors.primarySoft : colors.muted }]}>
                    <Ionicons name={getModeIcon(mode)} size={24} color={active ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={styles.modeInfo}>
                    <View style={styles.modeHeaderRow}>
                      <Text style={[styles.modeLabel, { color: colors.text }]}>{getModeLabel(mode)}</Text>
                      <Text style={[styles.modeReward, { color: colors.accent }]}>{getModeReward(mode)}</Text>
                    </View>
                    <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>{getModeDesc(mode)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA Action */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={startMatching}
            style={[styles.startBtn, { backgroundColor: colors.primary, borderRadius: radii.lg, marginTop: spacing.xl }]}
          >
            <Text style={styles.startBtnText}>Jangni boshlash ⚔️</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontWeight: '800',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  statsCardLeft: {
    flex: 1,
  },
  rankTitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  userXp: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statsCardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modesContainer: {
    gap: 12,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  activeModeCard: {
    borderWidth: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  modeReward: {
    fontSize: 14,
    fontWeight: '900',
  },
  modeDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  startBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default BattleLobbyScreen;
