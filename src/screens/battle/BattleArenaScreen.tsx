import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';
import Screen from '../../components/common/Screen';
import ProgressBar from '../../components/common/ProgressBar';

interface Player {
  id: string;
  name: string;
  avatar: string;
  title: string;
  isMe: boolean;
  team: 'blue' | 'red';
}

interface Question {
  id: string;
  code: string;
  question: string;
  options: string[];
  answerIdx: number;
}

const BATTLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    code: 'console.log(typeof NaN);',
    question: 'Ushbu kod qanday qiymat qaytaradi?',
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    answerIdx: 0,
  },
  {
    id: 'q2',
    code: 'console.log(3 + + "3");',
    question: 'Ushbu JavaScript kodi qanday natija beradi?',
    options: ['6', '"33"', 'NaN', '"3+3"'],
    answerIdx: 0,
  },
  {
    id: 'q3',
    code: 'const a = {};\nconst b = { key: "b" };\nconst c = { key: "c" };\na[b] = 123;\na[c] = 456;\nconsole.log(a[b]);',
    question: 'Ushbu kodning natijasi nima?',
    options: ['456', '123', 'undefined', 'TypeError'],
    answerIdx: 0,
  },
  {
    id: 'q4',
    code: 'console.log([] == ![]);',
    question: 'Ushbu taqqoslash natijasi nima bo\'ladi?',
    options: ['true', 'false', 'undefined', 'TypeError'],
    answerIdx: 0,
  },
  {
    id: 'q5',
    code: 'let x = [1, 2, 3];\nlet y = x.map(num => {\n  x.push(num * 2);\n  return num;\n});\nconsole.log(y.length);',
    question: 'x.map ishga tushganda y massivi uzunligi nechaga teng?',
    options: ['3', '6', 'Infinity', 'TypeError'],
    answerIdx: 0,
  },
  {
    id: 'q6',
    code: 'const promise = new Promise((resolve) => {\n  console.log(1);\n  resolve(2);\n});\npromise.then(res => console.log(res));\nconsole.log(3);',
    question: 'Konsolga chiqish ketma-ketligi qanday bo\'ladi?',
    options: ['1, 3, 2', '1, 2, 3', '3, 1, 2', '2, 1, 3'],
    answerIdx: 0,
  },
];

const BattleArenaScreen = () => {
  const { colors, spacing, radii, typography } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const mode = route.params?.mode || '1v1';
  const players: Player[] = route.params?.players || [];

  const [timeLeft, setTimeLeft] = useState(60);
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [lockedTime, setLockedTime] = useState(0); // Wrong answer penalty timer

  // Bots status updates
  const [playerStatusText, setPlayerStatusText] = useState<Record<string, string>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simRef = useRef<NodeJS.Timeout | null>(null);

  // Active question
  const currentQuestion = BATTLE_QUESTIONS[currentQIdx % BATTLE_QUESTIONS.length];

  // 1. Time Limit countdown triggers end of battle when it hits 0
  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simRef.current) clearInterval(simRef.current);
      endBattle();
    }
  }, [timeLeft]);

  useEffect(() => {
    // 1. Time Limit Countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // 2. Teammates and Opponents Gameplay Simulation
    simRef.current = setInterval(() => {
      // Rand o'yinchi tanlash (o'zimizdan tashqari botlar)
      const bots = players.filter((p) => !p.isMe);
      if (bots.length === 0) return;

      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const action = Math.random();

      if (action < 0.25) {
        // Bot fikrlamoqda
        setPlayerStatusText((prev) => ({ ...prev, [randomBot.id]: 'Fikrlamoqda...' }));
      } else if (action < 0.6) {
        // Bot to'g'ri javob berdi!
        const pts = 10 + Math.floor(Math.random() * 8);
        setPlayerStatusText((prev) => ({ ...prev, [randomBot.id]: `To'g'ri javob berdi (+${pts} pts)!` }));
        
        if (randomBot.team === 'blue') {
          setBlueScore((s) => s + pts);
        } else {
          setRedScore((s) => s + pts);
        }

        // 1.5 soniyadan keyin holatni tozalaymiz
        setTimeout(() => {
          setPlayerStatusText((prev) => {
            const next = { ...prev };
            delete next[randomBot.id];
            return next;
          });
        }, 1500);
      } else {
        // Bot xato javob berdi
        setPlayerStatusText((prev) => ({ ...prev, [randomBot.id]: 'Xato javob berdi (block)!' }));
        setTimeout(() => {
          setPlayerStatusText((prev) => {
            const next = { ...prev };
            delete next[randomBot.id];
            return next;
          });
        }, 1500);
      }
    }, 1800);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [players, blueScore, redScore]);

  // Penalty timer check
  useEffect(() => {
    if (lockedTime <= 0) return;
    const penalty = setTimeout(() => {
      setLockedTime((t) => t - 1);
    }, 1000);
    return () => clearTimeout(penalty);
  }, [lockedTime]);

  const endBattle = () => {
    // XP reward calculation
    const isVictory = blueScore > redScore;
    const status = isVictory ? 'victory' : 'defeat';
    let xpEarned = 10; // defeat consolation

    if (isVictory) {
      if (mode === '1v1') xpEarned = 50;
      else if (mode === '2v2') xpEarned = 75;
      else xpEarned = 100;
    }

    navigation.replace('BattleResult', { mode, status, xpEarned });
  };

  const handleSelectOption = (idx: number) => {
    if (lockedTime > 0 || selectedOpt !== null) return;

    setSelectedOpt(idx);

    if (idx === currentQuestion.answerIdx) {
      // To'g'ri javob
      triggerHaptic('success');
      setBlueScore((s) => s + 15);
      
      // 800ms dan keyin keyingi savolga o'tamiz
      setTimeout(() => {
        setSelectedOpt(null);
        setCurrentQIdx((prev) => prev + 1);
      }, 800);
    } else {
      // Xato javob
      triggerHaptic('error');
      setLockedTime(2); // 2 soniya block
      setSelectedOpt(null);
    }
  };

  // Tug of war ratio
  const total = blueScore + redScore || 1;
  const blueRatio = Math.max(10, Math.min(90, (blueScore / total) * 100));

  const blueTeam = players.filter((p) => p.team === 'blue');
  const redTeam = players.filter((p) => p.team === 'red');

  return (
    <Screen padded={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Battle Tug of War Header */}
        <View style={[styles.battleHeader, { paddingHorizontal: spacing.xl }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>{blueScore} pts</Text>
            <View style={[styles.timerPill, { backgroundColor: colors.muted }]}>
              <Ionicons name="time-outline" size={16} color={colors.text} style={{ marginRight: 4 }} />
              <Text style={[styles.timerText, { color: colors.text }]}>{timeLeft}s</Text>
            </View>
            <Text style={[styles.scoreText, { color: colors.error }]}>{redScore} pts</Text>
          </View>

          {/* Tug-of-war visual bar */}
          <View style={[styles.barTrack, { backgroundColor: colors.error, borderRadius: radii.pill }]}>
            <View
              style={[
                styles.barFillBlue,
                {
                  width: `${blueRatio}%`,
                  backgroundColor: colors.primary,
                  borderTopLeftRadius: radii.pill,
                  borderBottomLeftRadius: radii.pill,
                },
              ]}
            />
          </View>
        </View>

        {/* Live Teammates & Enemies updates */}
        <View style={styles.liveGrid}>
          {/* Teammates */}
          <View style={styles.liveColumn}>
            {blueTeam.map((p) => (
              <View key={p.id} style={styles.miniCard}>
                <Image source={{ uri: p.avatar }} style={styles.miniAvatar} />
                <View style={styles.miniMeta}>
                  <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={1}>
                    {p.name} {p.isMe && '(Siz)'}
                  </Text>
                  {playerStatusText[p.id] ? (
                    <Text style={[styles.miniStatus, { color: colors.primary }]} numberOfLines={1}>
                      {playerStatusText[p.id]}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* Opponents */}
          <View style={styles.liveColumn}>
            {redTeam.map((p) => (
              <View key={p.id} style={[styles.miniCard, { flexDirection: 'row-reverse' }]}>
                <Image source={{ uri: p.avatar }} style={styles.miniAvatar} />
                <View style={[styles.miniMeta, { alignItems: 'flex-end', marginLeft: 0, marginRight: 8 }]}>
                  <Text style={[styles.miniName, { color: colors.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {playerStatusText[p.id] ? (
                    <Text style={[styles.miniStatus, { color: colors.error }]} numberOfLines={1}>
                      {playerStatusText[p.id]}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Coding Q&A Card */}
        <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.lg }]}>
          {lockedTime > 0 ? (
            <View style={styles.lockoutOverlay}>
              <Ionicons name="lock-closed" size={48} color={colors.error} />
              <Text style={[styles.lockoutText, { color: colors.error }]}>Bloklandi: {lockedTime}s</Text>
              <Text style={[styles.lockoutSub, { color: colors.textSecondary }]}>Noto'g'ri javob uchun 2 soniya jazo</Text>
            </View>
          ) : null}

          {/* Code block */}
          <View style={[styles.codeBlock, { backgroundColor: colors.muted, borderRadius: radii.md }]}>
            <Text style={[styles.codeText, { color: colors.text }]}>{currentQuestion.code}</Text>
          </View>

          {/* Question title */}
          <Text style={[styles.questionText, { color: colors.text, fontSize: typography.sizes.md }]}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Options grid */}
        <View style={[styles.optionsWrap, { paddingHorizontal: spacing.xl }]}>
          {currentQuestion.options.map((opt, idx) => {
            const isCorrect = idx === currentQuestion.answerIdx;
            const isSelected = idx === selectedOpt;
            
            let btnBg = colors.card;
            let btnBorder = colors.border;
            if (isSelected) {
              btnBg = isCorrect ? colors.success + '20' : colors.error + '20';
              btnBorder = isCorrect ? colors.success : colors.error;
            }

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleSelectOption(idx)}
                disabled={lockedTime > 0 || selectedOpt !== null}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: btnBg,
                    borderColor: btnBorder,
                    borderRadius: radii.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? (isCorrect ? colors.success : colors.error) : colors.text,
                    },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </SafeAreaView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  battleHeader: {
    paddingVertical: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontWeight: '800',
    fontSize: 14,
  },
  barTrack: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  barFillBlue: {
    height: '100%',
  },
  liveGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 110,
    gap: 8,
  },
  liveColumn: {
    flex: 1,
    gap: 4,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    height: 24,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  miniMeta: {
    flex: 1,
    marginLeft: 8,
  },
  miniName: {
    fontSize: 10,
    fontWeight: '700',
  },
  miniStatus: {
    fontSize: 8,
    fontWeight: '900',
  },
  questionCard: {
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    minHeight: 220,
    justifyContent: 'center',
  },
  lockoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 14, 26, 0.95)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  lockoutText: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  lockoutSub: {
    fontSize: 12,
    marginTop: 4,
  },
  codeBlock: {
    padding: 12,
    marginBottom: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  questionText: {
    fontWeight: '700',
    lineHeight: 20,
  },
  optionsWrap: {
    gap: 8,
    marginBottom: 12,
  },
  optionBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default BattleArenaScreen;
