import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import Screen from '../../components/common/Screen';
import { useAppSelector } from '../../store/hooks';
import { rankingApi } from '../../api/rankingApi';

const CANDIDATE_NAMES = [
  'Sherzod', 'Zilola', 'Abbos', 'Madina', 'Javohir', 'Dilnoza',
  'Rustam', 'Nodira', 'Jasur', 'Malika', 'Sardor', 'Shahzoda',
  'Olim', 'Gulnoza', 'Farrux', 'Rayxon', 'Bekzod', 'Lola'
];

const CANDIDATE_TITLES = ['CODER', 'HACKER', 'GURU', 'PRO', 'NINJA', 'GEEK', 'WIZARD'];

// Sonar Radar Ring komponenti
const RadarRing = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.8);
  const { colors } = useTheme();

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.radarRing,
        { borderColor: colors.primary, borderWidth: 2 },
        style,
      ]}
    />
  );
};

interface Player {
  id: string;
  name: string;
  avatar: string;
  title: string;
  isMe: boolean;
  team: 'blue' | 'red';
}

const BattleMatchingScreen = () => {
  const { colors, spacing, radii } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.mode || '1v1';

  const user = useAppSelector((state) => state.auth.user);

  const [matchedPlayers, setMatchedPlayers] = useState<Player[]>([]);
  const [matchingStatus, setMatchingStatus] = useState('Raqiblar qidirilmoqda...');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Redux user ni o'qish uchun local import helper
  // (Circular import oldini olish uchun local thunk inline hooks orqali ulanadi)
  const myAvatar = user?.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${user?.username || 'me'}`;
  const myName = user?.firstName || 'Men';

  useEffect(() => {
    triggerHaptic('medium');
    let activeInterval: NodeJS.Timeout | null = null;
    
    // O'zimizni Blue jamoaga qo'shamiz
    const me: Player = {
      id: 'me',
      name: myName,
      avatar: myAvatar,
      title: user?.rankTitle || 'AMATEUR',
      isMe: true,
      team: 'blue',
    };

    setMatchedPlayers([me]);

    // O'yinchilar sig'imi
    const targetCount = mode === '1v1' ? 2 : (mode === '2v2' ? 4 : 8);
    const blueTeamSpots = mode === '1v1' ? 1 : (mode === '2v2' ? 2 : 4);

    const loadRealPlayersAndMatch = async () => {
      let candidatePool: any[] = [];
      try {
        const response = await rankingApi.getTopUsers({ limit: 30 });
        const usersList = response.data?.data?.users ?? response.data?.users ?? response.data?.data ?? [];
        if (Array.isArray(usersList) && usersList.length > 0) {
          // O'zimizdan tashqari boshqa real o'yinchilarni olamiz
          candidatePool = usersList.filter((u: any) => u.username !== user?.username);
        }
      } catch (err) {
        console.log('[MATCHING] Error fetching real users:', err);
      }

      const simulatedPlayers: Player[] = [];
      
      for (let i = 1; i < targetCount; i++) {
        const isBlue = i < blueTeamSpots;
        const seed = Math.random().toString(36).substring(7);
        
        // Agar platformada real foydalanuvchilar bo'lsa, ulardan birini raqib qilamiz
        const realUser = candidatePool.length > 0 
          ? candidatePool.splice(Math.floor(Math.random() * candidatePool.length), 1)[0] 
          : null;

        if (realUser) {
          simulatedPlayers.push({
            id: realUser._id || realUser.id || `real_${i}_${seed}`,
            name: realUser.firstName || realUser.username || `Player_${i}`,
            avatar: realUser.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${realUser.username || seed}`,
            title: realUser.rankTitle || 'CODER',
            isMe: false,
            team: isBlue ? 'blue' : 'red',
          });
        } else {
          // Fallback: botlar
          const name = CANDIDATE_NAMES[Math.floor(Math.random() * CANDIDATE_NAMES.length)];
          const title = CANDIDATE_TITLES[Math.floor(Math.random() * CANDIDATE_TITLES.length)];
          simulatedPlayers.push({
            id: `bot_${i}_${seed}`,
            name,
            avatar: `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`,
            title,
            isMe: false,
            team: isBlue ? 'blue' : 'red',
          });
        }
      }

      // O'yinchilarni ketma-ket qo'shib borish (matching jarayoni tuyg'usi)
      let currentIdx = 0;
      activeInterval = setInterval(() => {
        if (currentIdx < simulatedPlayers.length) {
          const nextPlayer = simulatedPlayers[currentIdx];
          if (nextPlayer) {
            triggerHaptic('light');
            setMatchedPlayers((prev) => [...prev, nextPlayer]);
          }
          currentIdx++;
        } else {
          if (activeInterval) clearInterval(activeInterval);
          triggerHaptic('success');
          setMatchingStatus('Jang topildi! ⚔️');
          
          // 3 soniyalik countdown boshlanadi
          setCountdown(3);
        }
      }, 900);
    };

    loadRealPlayersAndMatch();

    return () => {
      if (activeInterval) clearInterval(activeInterval);
    };
  }, []);

  // Countdown timer boshqarilishi
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        triggerHaptic('light');
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // 0 bo'lganda arenaga kiradi
      triggerHaptic('success');
      navigation.replace('BattleArena', { mode, players: matchedPlayers });
    }
  }, [countdown]);

  const blueTeam = matchedPlayers.filter((p) => p && p.team === 'blue');
  const redTeam = matchedPlayers.filter((p) => p && p.team === 'red');

  return (
    <Screen padded={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Radar qismi */}
        <View style={styles.radarContainer}>
          <RadarRing delay={0} />
          <RadarRing delay={800} />
          <RadarRing delay={1600} />

          <View style={[styles.radarCenter, { backgroundColor: colors.primary }]}>
            {countdown !== null ? (
              <Text style={styles.countdownText}>{countdown > 0 ? countdown : 'GO!'}</Text>
            ) : (
              <Ionicons name="game-controller" size={32} color="#fff" />
            )}
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusWrap}>
          <Text style={[styles.statusText, { color: colors.text }]}>{matchingStatus}</Text>
          {countdown === null && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}
        </View>

        {/* Jamoalar taqsimoti */}
        <View style={styles.teamsGrid}>
          {/* Bizning jamoa (Blue) */}
          <View style={styles.teamColumn}>
            <Text style={[styles.teamHeader, { color: colors.primary }]}>Ko'k Jamoa</Text>
            <View style={styles.playersList}>
              {Array.from({ length: mode === '1v1' ? 1 : (mode === '2v2' ? 2 : 4) }).map((_, idx) => {
                const player = blueTeam[idx];
                return (
                  <View
                    key={`blue_${idx}`}
                    style={[
                      styles.playerCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: player ? colors.primary : colors.border,
                        borderRadius: radii.md,
                      },
                    ]}
                  >
                    {player ? (
                      <>
                        <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                        <View style={styles.playerMeta}>
                          <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
                            {player.name} {player.isMe && '(Siz)'}
                          </Text>
                          <Text style={[styles.playerTitle, { color: colors.primary }]}>{player.title}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.emptySlot, { color: colors.textSecondary }]}>Qidirilmoqda...</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* VS ajratuvchi */}
          <View style={styles.vsWrap}>
            <Text style={[styles.vsText, { color: colors.textSecondary }]}>VS</Text>
          </View>

          {/* Raqiblar (Red) */}
          <View style={styles.teamColumn}>
            <Text style={[styles.teamHeader, { color: colors.error }]}>Qizil Jamoa</Text>
            <View style={styles.playersList}>
              {Array.from({ length: mode === '1v1' ? 1 : (mode === '2v2' ? 2 : 4) }).map((_, idx) => {
                const player = redTeam[idx];
                return (
                  <View
                    key={`red_${idx}`}
                    style={[
                      styles.playerCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: player ? colors.error : colors.border,
                        borderRadius: radii.md,
                      },
                    ]}
                  >
                    {player ? (
                      <>
                        <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
                        <View style={styles.playerMeta}>
                          <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
                            {player.name}
                          </Text>
                          <Text style={[styles.playerTitle, { color: colors.error }]}>{player.title}</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={[styles.emptySlot, { color: colors.textSecondary }]}>Qidirilmoqda...</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Screen>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  radarContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  radarRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  radarCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  countdownText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  statusWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
  },
  teamsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  teamColumn: {
    flex: 1,
  },
  teamHeader: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playersList: {
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    height: 52,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  playerMeta: {
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  playerTitle: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  emptySlot: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  vsWrap: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
  },
});

export default BattleMatchingScreen;
