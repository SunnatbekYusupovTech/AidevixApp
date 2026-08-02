import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import FadeInView from '../../components/common/FadeInView';
import { useAppDispatch } from '../../store/hooks';
import { addDownloadedVideo } from '../../store/slices/offlineSlice';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import { downloadVideo, getLocalVideoUri } from '../../utils/download';
import { videoApi } from '../../api/videoApi';
import { xpApi } from '../../api/xpApi';
import BookmarkModal from './BookmarkModal';

interface VideoData {
  _id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  thumbnail: string;
  materials: any[];
  course: any;
  views: number;
  rating: number;
}

interface PlayerData {
  embedUrl: string;
  expiresAt: string;
}

const VideoPlayerScreen = ({ route }: any) => {
  const { colors, spacing, radii } = useTheme();
  const dispatch = useAppDispatch();
  const { videoId, courseId } = route.params;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const storageKey = `@offline_video_${videoId}`;

  // Video ma'lumotlarini API dan olish
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await videoApi.getVideo(videoId);
        const data = response.data?.data;
        if (data?.video) setVideo(data.video);
        if (data?.player) setPlayer(data.player);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Video yuklanmadi';
        const code = err?.response?.data?.code;
        if (code === 'PRO_REQUIRED') {
          setError('Bu dars Pro obuna uchun ochiq. Pro sotib oling.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
    checkDownloaded();
  }, [videoId]);

  // Video ko'rilganda XP berish (bir marta)
  const awardXp = async () => {
    if (xpAwarded) return;
    try {
      await xpApi.markVideoWatched(videoId);
      setXpAwarded(true);
    } catch {
      // XP berish muvaffaqiyatsiz — foydalanuvchi tajribasiga ta'sir qilmaydi
    }
  };

  const checkDownloaded = async () => {
    try {
      const localUri = await getLocalVideoUri(videoId);
      if (localUri) {
        setIsDownloaded(true);
        await AsyncStorage.setItem(storageKey, localUri);
      } else {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) setIsDownloaded(true);
      }
    } catch {
      // ignore
    }
  };

  const handleDownload = async () => {
    if (isDownloaded || isDownloading || !player?.embedUrl) return;
    triggerHaptic('medium');
    setIsDownloading(true);
    setDownloadProgress(0);

    const uri = await downloadVideo(player.embedUrl, videoId, (progress) => {
      setDownloadProgress(Math.round(progress * 100));
    });

    if (uri) {
      setIsDownloaded(true);
      setIsDownloading(false);
      setDownloadProgress(null);
      triggerHaptic('success');
      await AsyncStorage.setItem(storageKey, uri);
      dispatch(
        addDownloadedVideo({
          _id: videoId,
          title: video?.title || 'Video darslik',
          description: video?.description || '',
          course: courseId || '',
          order: video?.order || 0,
          duration: String(video?.duration || '0'),
          thumbnail: video?.thumbnail || '',
          bunnyVideoId: '',
          bunnyStatus: 'finished',
          viewCount: video?.views || 0,
        })
      );
    } else {
      setIsDownloading(false);
      setDownloadProgress(null);
      triggerHaptic('error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Video yuklanmoqda...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Video pleer */}
      <View style={styles.videoContainer}>
        {player?.embedUrl ? (
          <WebView
            source={{ uri: player.embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            onLoad={() => {
              // Video yuklanganda XP berish (30 soniya kechikish bilan)
              setTimeout(awardXp, 30000);
            }}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.4)" />
            <Text style={styles.videoPlaceholderText}>Video hali tayyor emas</Text>
          </View>
        )}

        {/* Yuklab olish tugmasi */}
        {player?.embedUrl && (
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.md }]}
            onPress={handleDownload}
            disabled={isDownloaded || isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.progressText}>{downloadProgress ?? 0}%</Text>
              </View>
            ) : isDownloaded ? (
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
            ) : (
              <Ionicons name="cloud-download-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}

        {/* Bookmark tugmasi */}
        <TouchableOpacity
          style={[styles.bookmarkBtn, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.md }]}
          onPress={() => {
            triggerHaptic('light');
            setShowBookmarks(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FadeInView style={[styles.content, { padding: spacing.xl }]}>
        <Text style={[styles.title, { color: colors.text }]}>{video?.title || 'Video darslik'}</Text>
        {video?.description ? (
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{video.description}</Text>
        ) : null}
        {video?.views !== undefined && (
          <Text style={[styles.viewCount, { color: colors.textSecondary }]}>
            {video.views} marta ko'rilgan
          </Text>
        )}
        {isDownloaded && (
          <View style={[styles.downloadedBadge, { backgroundColor: colors.success + '22', borderRadius: radii.sm }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.downloadedBadgeText, { color: colors.success }]}>
              Oflayn saqlangan
            </Text>
          </View>
        )}
        {xpAwarded && (
          <View style={[styles.xpBadge, { backgroundColor: colors.primary + '22', borderRadius: radii.sm }]}>
            <Ionicons name="flash" size={14} color={colors.primary} />
            <Text style={[styles.downloadedBadgeText, { color: colors.primary }]}>
              +50 XP olindi!
            </Text>
          </View>
        )}
      </FadeInView>

      <BookmarkModal
        visible={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        videoId={videoId}
        courseId={courseId || ''}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    width: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 8,
  },
  videoPlaceholderText: { color: 'rgba(255,255,255,0.6)' },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 12, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  downloadBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 62,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 2,
  },
  progressText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 16, lineHeight: 24 },
  viewCount: { fontSize: 13, marginTop: 4 },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  downloadedBadgeText: { fontSize: 12, fontWeight: '600' },
});

export default VideoPlayerScreen;
