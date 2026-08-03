import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUserLocal } from '../../store/slices/authSlice';
import Screen from '../../components/common/Screen';
import GradientCard from '../../components/common/GradientCard';
import { LinearGradient } from 'expo-linear-gradient';

const BattleResultScreen = () => {
  const { colors, spacing, radii, typography, gradients } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const mode = route.params?.mode || '1v1';
  const status: 'victory' | 'defeat' = route.params?.status || 'victory';
  const xpEarned = route.params?.xpEarned || 0;

  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    triggerHaptic(status === 'victory' ? 'success' : 'warning');

    // Foydalanuvchining mahalliy Redux XP ko'rsatkichini yangilash
    if (xpEarned > 0 && user) {
      dispatch(updateUserLocal({ xp: (user.xp || 0) + xpEarned }));
    }
  }, []);

  const handleBattleAgain = () => {
    triggerHaptic('medium');
    navigation.replace('BattleLobby');
  };

  const handleGoHome = () => {
    triggerHaptic('light');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const isWin = status === 'victory';

  return (
    <Screen padded={false}>
      <LinearGradient
        colors={isWin ? ['#1E1B4B', '#0F172A'] : ['#450A0A', '#0F172A']}
        style={styles.container}
      >
        <SafeAreaView style={styles.content}>
          {/* Status Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconRing,
                {
                  backgroundColor: isWin ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isWin ? '#FBBF24' : '#EF4444',
                },
              ]}
            >
              <Ionicons
                name={isWin ? 'trophy' : 'close-circle'}
                size={80}
                color={isWin ? '#FBBF24' : '#EF4444'}
              />
            </View>
            <Text style={[styles.statusTitle, { color: isWin ? '#FBBF24' : '#EF4444' }]}>
              {isWin ? "G'ALABA!" : 'MAG\'LUBIYAT'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              {isWin
                ? 'Siz va jamoangiz jangda g\'olib bo\'ldingiz!'
                : 'Jang yakunlandi. Keyingi safar albatta g\'olib bo\'lasiz!'}
            </Text>
          </View>

          {/* Reward Card */}
          <View style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.lg }]}>
            <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>KODLASH JANGI MUKOFOTI</Text>
            <Text style={[styles.rewardValue, { color: colors.primary }]}>+{xpEarned} XP</Text>
            
            <View style={[styles.modeRow, { backgroundColor: colors.muted, borderRadius: radii.md }]}>
              <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>Jang formati:</Text>
              <Text style={[styles.modeText, { color: colors.text }]}>
                {mode === '1v1' ? '1vs1 Duel' : mode === '2v2' ? '2vs2 Duo' : '4vs4 Squad'}
              </Text>
            </View>

            <View style={[styles.totalRow]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Yangi umumiy XP:</Text>
              <Text style={[styles.totalText, { color: colors.accent }]}>
                {((user?.xp || 0) + xpEarned).toLocaleString()} XP
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleBattleAgain}
              style={[styles.btnPrimary, { backgroundColor: colors.primary, borderRadius: radii.lg }]}
            >
              <Text style={styles.btnPrimaryText}>Yana jang qilish ⚔i</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoHome}
              style={[styles.btnSecondary, { borderColor: colors.border, borderRadius: radii.lg }]}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.text }]}>Bosh sahifaga qaytish</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  statusTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  rewardCard: {
    padding: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rewardValue: {
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 12,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionsWrap: {
    gap: 12,
    marginBottom: 20,
  },
  btnPrimary: {
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnSecondary: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BattleResultScreen;
