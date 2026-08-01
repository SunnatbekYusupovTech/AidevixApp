import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Course } from '../../types/course';
import Card from '../common/Card';

// Backend thumbnail yo'lini to'liq URLga aylantirish.
// Ba'zan backend nisbiy yo'l (/uploads/...) yoki faqat fayl nomi qaytaradi —
// shuning uchun biz API_URL'dan base hostni ajratib olamiz.
const resolveImageUrl = (url: string | undefined | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // To'liq URL allaqachon bo'lsa — qaytaramiz
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Nisbiy yo'l — API base URL dan host qismini olib to'liq URL yasaymiz
  // API_URL = "https://aidevix-backend-production.up.railway.app/api" kabi
  // Biz faqat "https://aidevix-backend-production.up.railway.app" qismini olamiz
  try {
    const { API_URL } = require('../../utils/constants');
    // /api prefixini olib tashlaymiz — faqat host kerak
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${path}`;
  } catch {
    return null;
  }
};

// Kategoriya bo'yicha ikonka tanlash
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    html: 'code-slash',
    css: 'color-palette',
    javascript: 'logo-javascript',
    react: 'logo-react',
    typescript: 'code-working',
    nodejs: 'logo-nodejs',
    ai: 'sparkles',
    telegram: 'paper-plane',
    security: 'shield-checkmark',
    career: 'briefcase',
    nocode: 'apps',
    web3: 'globe',
    general: 'book',
  };
  return map[category?.toLowerCase()] || 'book';
};

interface CourseCardProps {
  course: Course;
  onPress: (id: string) => void;
  horizontal?: boolean;
}

const CourseCard = ({ course, onPress, horizontal = false }: CourseCardProps) => {
  const { colors, spacing } = useTheme();
  const [imageError, setImageError] = useState(false);

  const thumbnailUrl = resolveImageUrl(course.thumbnail);
  const showImage = !!thumbnailUrl && !imageError;

  return (
    <Card
      noPadding
      onPress={() => onPress(course._id)}
      style={{
        width: horizontal ? 280 : '100%',
        marginRight: horizontal ? spacing.md : 0,
        marginBottom: horizontal ? 0 : spacing.md,
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={300}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: colors.primarySoft }]}>
          <Ionicons
            name={getCategoryIcon(course.category)}
            size={36}
            color={colors.primary}
          />
          <Text style={[styles.placeholderText, { color: colors.primary }]}>
            {course.category?.toUpperCase() || 'KURS'}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.category, { color: colors.primary }]}>{course.category.toUpperCase()}</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {course.title}
        </Text>

        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {course.rating || 0} ({course.ratingCount || 0})
            </Text>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>
            {course.isFree ? 'Bepul' : `${course.price.toLocaleString()} UZS`}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: 120,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CourseCard;

