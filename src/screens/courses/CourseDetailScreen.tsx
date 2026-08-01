import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { courseApi } from '../../api/courseApi';
import { Course, Section, Video } from '../../types/course';
import Loader from '../../components/common/Loader';
import FadeInView from '../../components/common/FadeInView';
import AnimatedPressable from '../../components/common/AnimatedPressable';
import { triggerHaptic } from '../../utils/haptics';
import { API_URL } from '../../utils/constants';

interface Props {
  route: { params: { courseId: string } };
  navigation: any;
}

const safeText = (v: any, fallback = ''): string => {
  if (v == null) return fallback;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') {
    return v.name ?? v.title ?? v.username ?? v.label ?? fallback;
  }
  return String(v);
};

const safeNumber = (v: any, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Backend thumbnail nisbiy yo'l qaytarishi mumkin — to'liq URLga aylantirish
const resolveImageUrl = (url: string | undefined | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  try {
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${path}`;
  } catch {
    return null;
  }
};

const CourseDetailScreen = ({ route, navigation }: Props) => {
  const { colors, spacing, radii } = useTheme();
  const { courseId } = route.params;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [flatVideos, setFlatVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `<` doimo Kurslar ro'yxatiga olib boradi. canGoBack() butun navigatsiya
  // daraxtini tekshiradi, shuning uchun Home'dan kelganda Home'ga qaytarib yuborardi.
  // Shartsiz Courses'ga navigate qilamiz (stack'da bo'lsa pop, bo'lmasa push).
  const handleBack = () => {
    triggerHaptic('light');
    navigation.navigate('Courses');
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    courseApi
      .getCourseById(courseId)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.data ?? res.data ?? {};
        const c: Course | undefined = raw.course ?? raw;
        const s: Section[] = raw.sections ?? c?.sections ?? [];
        const v: Video[] = raw.videos ?? c?.videos ?? [];

        setCourse(c ?? null);
        setSections(Array.isArray(s) ? s : []);
        setFlatVideos(Array.isArray(v) ? v : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ?? 'Kursni yuklab bo\'lmadi. Internetni tekshiring.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const openVideo = (video: Video) => {
    triggerHaptic('light');
    navigation.navigate('VideoPlayer', { videoId: video._id, courseId });
  };

  if (loading) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <Loader fullScreen />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error ?? 'Kurs topilmadi'}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: radii.md }]}
        >
          <Text style={styles.backBtnText}>Orqaga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderVideoRow = (video: Video, index: number) => (
    <AnimatedPressable
      key={video._id}
      scaleDown={0.98}
      style={[
        styles.videoRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
      onPress={() => openVideo(video)}
    >
      <View style={[styles.videoIndex, { backgroundColor: colors.primarySoft, borderRadius: radii.md }]}>
        <Text style={[styles.videoIndexText, { color: colors.primary }]}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.videoMeta}>
        <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
          {safeText(video.title)}
        </Text>
        {!!safeText(video.duration) && (
          <View style={styles.videoDuration}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.videoDurationText, { color: colors.textSecondary }]}>
              {safeText(video.duration)}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="play-circle" size={28} color={colors.primary} />
    </AnimatedPressable>
  );

  const hasSections = sections.length > 0;
  const hasFlatVideos = flatVideos.length > 0;
  const noLessons = !hasSections && !hasFlatVideos;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {(() => {
            const heroUrl = resolveImageUrl(course.thumbnail);
            if (heroUrl) {
              return (
                <Image
                  source={{ uri: heroUrl }}
                  style={styles.hero}
                  contentFit="cover"
                  transition={300}
                />
              );
            }
            return (
              <View style={[styles.hero, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="book" size={56} color={colors.primary} />
              </View>
            );
          })()}
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnLeft]}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FadeInView style={[styles.content, { padding: spacing.xl }]}>
          <Text style={[styles.category, { color: colors.primary }]}>
            {safeText(course.category).toUpperCase()}
            {course.level ? `  ·  ${safeText(course.level)}` : ''}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {safeText(course.title)}
          </Text>

          {(() => {
            const inst: any = course.instructor;
            const name =
              typeof inst === 'string'
                ? inst
                : inst?.username ?? inst?.email ?? inst?.jobTitle ?? '';
            if (!name) return null;
            return (
              <View style={styles.instructorRow}>
                <Ionicons name="person-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.instructorText, { color: colors.textSecondary }]}>
                  {name}
                </Text>
              </View>
            );
          })()}

          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={colors.accent} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {safeNumber(course.rating)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>
                ({safeNumber(course.ratingCount)})
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {safeNumber(course.studentsCount)}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {safeText(course.totalDuration, '—')}
              </Text>
            </View>
          </View>

          <Text style={[styles.priceTag, { color: colors.primary }]}>
            {course.isFree ? 'Bepul' : `${safeNumber(course.price).toLocaleString()} UZS`}
          </Text>

          {!!safeText(course.description) && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>
                Kurs haqida
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {safeText(course.description)}
              </Text>
            </View>
          )}

          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>
              Darslar {hasSections || hasFlatVideos ? `· ${
                hasSections
                  ? sections.reduce((acc, s) => acc + (s.videos?.length ?? 0), 0)
                  : flatVideos.length
              } ta` : ''}
            </Text>

            {noLessons && (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.md }]}>
                <Ionicons name="film-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Darslar tez orada qo'shiladi
                </Text>
              </View>
            )}

            {hasSections &&
              sections.map((section) => (
                <View key={section._id} style={{ marginTop: spacing.md }}>
                  <Text style={[styles.sectionSubHeader, { color: colors.textSecondary }]}>
                    {safeText(section.title)}
                  </Text>
                  {(section.videos ?? []).map((v, i) => renderVideoRow(v, i))}
                </View>
              ))}

            {!hasSections && hasFlatVideos && (
              <View style={{ marginTop: spacing.md }}>
                {flatVideos.map((v, i) => renderVideoRow(v, i))}
              </View>
            )}
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  hero: { width: '100%', height: '100%' },
  headerBtn: {
    position: 'absolute',
    top: 44,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnLeft: { left: 16 },
  content: {},
  category: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  instructorText: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statSub: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 18,
  },
  priceTag: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  videoIndex: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndexText: {
    fontSize: 13,
    fontWeight: '700',
  },
  videoMeta: { flex: 1 },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  videoDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  videoDurationText: {
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default CourseDetailScreen;
