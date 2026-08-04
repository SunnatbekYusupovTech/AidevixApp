import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { todayKey } from '../utils/checkInGuard';

// Push notificationlar Expo Go SDK 53+ da ishlamaydi va crash beradi. 
// Shuning uchun Expo Go'da bo'lsak, mock qilamiz.
let Notifications: any;
if (Constants.appOwnership === 'expo') {
  console.warn('[NOTIFICATIONS] Expo Go aniqlandi. Push bildirishnomalar mock qilindi.');
  Notifications = {
    setNotificationHandler: () => {},
    AndroidImportance: { DEFAULT: 3, MAX: 4 },
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    cancelScheduledNotificationAsync: async () => {},
    scheduleNotificationAsync: async () => 'mock-id',
    cancelAllScheduledNotificationsAsync: async () => {},
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
} else {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// --- Sozlamalar kalitlari (SettingsScreen bilan bir xil) ---
export const STREAK_PREF = 'settings:streakReminder';
export const CHALLENGE_PREF = 'settings:challengeReminder';

const STREAK_PREFIX = 'streak-';
const CHALLENGE_PREFIX = 'challenge-';
const WINDOW_DAYS = 7; // necha kunlik eslatma oldindan turadi (iOS limiti 64 — xavfsiz)
const STREAK_HOUR = 20;
const CHALLENGE_HOUR = 18;

// Eski (legacy) repeating eslatma ID'si — endi ishlatilmaydi, tozalab turamiz.
const LEGACY_STREAK_ID = 'daily-streak-reminder';

const isEnabled = async (key: string) => (await AsyncStorage.getItem(key)) !== 'false';

// Ruxsat so'rash + Android kanal yaratish. App start'da bir marta chaqiriladi.
// Eslatma rejalashtirish endi useReminders hook orqali (holatga qarab) bo'ladi.
export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Eslatmalar',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    finalStatus = req.status;
  }
  return finalStatus === 'granted';
}

// Keyingi WINDOW_DAYS kun uchun sana ro'yxati (HH:00). O'tib ketgan vaqt va
// (skipToday=true bo'lsa) bugungi kun o'tkazib yuboriladi.
function buildWindow(hour: number, skipToday: boolean): { key: string; date: Date }[] {
  const now = new Date();
  const items: { key: string; date: Date }[] = [];
  for (let i = 0; i <= WINDOW_DAYS && items.length < WINDOW_DAYS; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(hour, 0, 0, 0);
    if (d.getTime() <= now.getTime()) continue; // o'tib ketgan
    if (i === 0 && skipToday) continue; // bugun allaqachon bajarilgan
    items.push({ key: todayKey(d), date: d });
  }
  return items;
}

// Window doirasidagi (va biroz ortig'i) barcha eslatmalarni o'chiramiz — keyin
// faqat kerakli kunlarni qayta qo'yamiz. ID sana asosida deterministik.
async function cancelWindow(prefix: string) {
  const now = new Date();
  const ids: string[] = [];
  for (let i = 0; i <= WINDOW_DAYS + 2; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    ids.push(prefix + todayKey(d));
  }
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

async function scheduleWindow(
  prefix: string,
  hour: number,
  skipToday: boolean,
  title: string,
  body: string,
) {
  const window = buildWindow(hour, skipToday);
  for (const { key, date } of window) {
    await Notifications.scheduleNotificationAsync({
      identifier: prefix + key,
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

// --- Streak eslatmasi ---
// checkedInToday=true bo'lsa bugungi kun o'tkazib yuboriladi (bezovta qilmaymiz).
export async function refreshStreakReminders(checkedInToday: boolean) {
  await Notifications.cancelScheduledNotificationAsync(LEGACY_STREAK_ID).catch(() => {});
  await cancelWindow(STREAK_PREFIX);
  if (!(await isEnabled(STREAK_PREF))) return;
  await scheduleWindow(
    STREAK_PREFIX,
    STREAK_HOUR,
    checkedInToday,
    '🔥 Streak\'ingni saqlab qol!',
    'Bugun hali check-in qilmading. Kirib XP yig\'ib ket!',
  );
}

export async function cancelStreakReminders() {
  await Notifications.cancelScheduledNotificationAsync(LEGACY_STREAK_ID).catch(() => {});
  await cancelWindow(STREAK_PREFIX);
}

// --- Kunlik challenge eslatmasi ---
// allDoneToday=true bo'lsa bugungi kun o'tkazib yuboriladi.
export async function refreshChallengeReminders(allDoneToday: boolean) {
  await cancelWindow(CHALLENGE_PREFIX);
  if (!(await isEnabled(CHALLENGE_PREF))) return;
  await scheduleWindow(
    CHALLENGE_PREFIX,
    CHALLENGE_HOUR,
    allDoneToday,
    '🎯 Bugungi sinov kutyapti!',
    'Kunlik challenge\'ni bajarib qo\'shimcha XP yig\'!',
  );
}

export async function cancelChallengeReminders() {
  await cancelWindow(CHALLENGE_PREFIX);
}
