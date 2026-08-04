import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { authApi } from '../../api/authApi';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../theme';
import FadeInView from '../../components/common/FadeInView';
import GradientCard from '../../components/common/GradientCard';
import { triggerHaptic } from '../../utils/haptics';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalXpEarned: number;
  referrals: Array<{
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    joinedAt: string;
    xpEarned: number;
  }>;
}

const ReferralsScreen = () => {
  const { colors, spacing, typography, radii } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((s) => s.auth);

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authApi.getReferrals();
        console.log('[REFERRALS-SCREEN] Raw Stats Response:', JSON.stringify(response.data));
        const data = response.data?.data ?? response.data ?? null;
        setStats(data);
      } catch (e: any) {
        console.log('[REFERRALS-SCREEN] Load Error:', e?.response?.data || e?.message);
        setError(e?.response?.data?.message || 'Ma\'lumotlarni yuklab bo\'lmadi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const referralCode = stats?.referralCode ?? user?.referralCode ?? '';
  const referralLink = `https://aidevix.uz/ref/${referralCode}`;

  const handleShare = async () => {
    triggerHaptic('medium');
    await Share.share({
      message: `Aidevix ilovasiga qo'shiling! Mening taklif kodim: ${referralCode}\n${referralLink}`,
      title: 'Aidevix ga taklif',
    });
  };

  const handleCopyCode = async () => {
    if (!referralCode) {
      Alert.alert('Xatolik', 'Taklif kodi yuklanmagan');
      return;
    }
    triggerHaptic('success');
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Nusxalandi', 'Taklif kodingiz nusxalandi! Endi uni do\'stlaringizga yuborishingiz mumkin.');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: typography.sizes.xxl, marginLeft: spacing.md },
          ]}
        >
          Do'st taklif qilish
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <FadeInView delay={0}>
          <GradientCard variant="brand" style={[styles.banner, { marginBottom: spacing.xl }]}>
            <Ionicons name="gift" size={40} color="rgba(255,255,255,0.95)" />
            <Text style={styles.bannerTitle}>Har bir do'st uchun XP oling</Text>
            <Text style={styles.bannerSub}>
              Do'stingiz ro'yxatdan o'tganda ikkalangiz ham bonus XP olasiz
            </Text>
          </GradientCard>
        </FadeInView>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.totalReferrals ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taklif qilingan</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              +{stats?.totalXpEarned ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>XP ishlandi</Text>
          </View>
        </View>

        {/* Referral code */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm },
          ]}
        >
          Sizning taklif kodingiz
        </Text>
        <TouchableOpacity
          style={[
            styles.codeBox,
            { backgroundColor: colors.card, borderColor: colors.primary, borderRadius: radii.lg, padding: spacing.lg },
          ]}
          onPress={handleCopyCode}
          activeOpacity={0.8}
        >
          <Text style={[styles.codeText, { color: colors.primary }]}>{referralCode}</Text>
          <Ionicons name="copy-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Share button */}
        <TouchableOpacity
          style={[
            styles.shareBtn,
            { backgroundColor: colors.primary, borderRadius: radii.lg, marginTop: spacing.md, padding: spacing.lg },
          ]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={20} color="#ffffff" />
          <Text style={styles.shareBtnText}>Do'stga ulashish</Text>
        </TouchableOpacity>

        {/* Error */}
        {error ? (
          <Text style={[styles.error, { color: colors.error, marginTop: spacing.md }]}>
            {error}
          </Text>
        ) : null}

        {/* Referrals list */}
        {(stats?.referrals?.length ?? 0) > 0 ? (
          <>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.sm },
              ]}
            >
              Taklif qilinganlar ({stats!.referrals.length})
            </Text>
            {stats!.referrals.map((ref, i) => (
              <FadeInView
                key={ref._id}
                delay={i * 50}
                style={[
                  styles.refRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={[styles.refAvatar, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.refLetter, { color: colors.primary }]}>
                    {ref.firstName?.[0] || ref.username?.[0] || '?'}
                  </Text>
                </View>
                <View style={styles.refInfo}>
                  <Text style={[styles.refName, { color: colors.text }]}>
                    {ref.firstName} {ref.lastName}
                  </Text>
                  <Text style={[styles.refDate, { color: colors.textSecondary }]}>
                    {new Date(ref.joinedAt).toLocaleDateString('uz-UZ')}
                  </Text>
                </View>
                <View style={styles.refXp}>
                  <Ionicons name="flash" size={14} color={colors.primary} />
                  <Text style={[styles.refXpText, { color: colors.primary }]}>
                    +{ref.xpEarned}
                  </Text>
                </View>
              </FadeInView>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  title: { fontWeight: '700' },
  banner: {
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 2,
  },
  codeText: { fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
  },
  shareBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  error: { textAlign: 'center', fontSize: 13 },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  refAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refLetter: { fontSize: 16, fontWeight: '700' },
  refInfo: { flex: 1 },
  refName: { fontSize: 14, fontWeight: '600' },
  refDate: { fontSize: 12, marginTop: 2 },
  refXp: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  refXpText: { fontSize: 14, fontWeight: '700' },
});

export default ReferralsScreen;
