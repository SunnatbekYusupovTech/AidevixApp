import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAppDispatch } from '../store/hooks';
import { googleLogin } from '../store/slices/authSlice';
import { triggerHaptic } from '../utils/haptics';

// Client ID'lar app.json → extra.googleAuth dan keladi (Google Cloud Console'dan).
const googleConfig = ((Constants.expoConfig?.extra as any)?.googleAuth ?? {}) as {
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
};

// Expo Go'da native modullar mavjud emas — runtime'da aniqlaymiz.
// Constants.executionEnvironment: 'storeClient' = Expo Go, 'standalone' / 'bare' = EAS build
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// @react-native-google-signin native modul — Expo Go'da ishlamaydi.
let GoogleSignin: any = null;
let isGoogleAvailable = false;

if (!isExpoGo) {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
    isGoogleAvailable = true;
  } catch {
    console.warn('[GOOGLE-AUTH] @react-native-google-signin mavjud emas.');
  }
} else {
  console.log('[GOOGLE-AUTH] Expo Go aniqlandi — Google Sign-In o\'chirilgan.');
}

/**
 * Google bilan kirish hook'i.
 *
 * Expo Go'da native modul YO'Q — `disabled=true`.
 * EAS Dev Client / production build'da to'liq ishlaydi.
 */
export const useGoogleAuth = (referralCode?: string) => {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isGoogleAvailable || !GoogleSignin) return;
    try {
      GoogleSignin.configure({
        webClientId: googleConfig.webClientId,
        iosClientId: googleConfig.iosClientId,
        offlineAccess: false,
      });
    } catch (err: any) {
      console.warn('[GOOGLE-AUTH] Configure xato:', err?.message);
    }
  }, []);

  const signIn = useCallback(async () => {
    if (!isGoogleAvailable || !GoogleSignin) {
      Alert.alert(
        'Google kirish',
        'Google orqali kirish Expo Go\'da ishlamaydi. Iltimos, email va parol orqali ro\'yxatdan o\'ting.\n\nGoogle kirish faqat production build\'da ishlaydi.',
      );
      return;
    }

    try {
      triggerHaptic('light');
      setSubmitting(true);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken ?? (userInfo as any)?.idToken;

      if (!idToken) {
        triggerHaptic('error');
        Alert.alert('Google kirish', 'Google hisob maʼlumotlari olinmadi. Qaytadan urinib ko\'ring.');
        return;
      }

      await dispatch(googleLogin({ idToken, referralCode })).unwrap();
    } catch (error: any) {
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        console.warn('[GOOGLE-AUTH] Xato:', error?.message ?? error);
        triggerHaptic('error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, referralCode]);

  return { signIn, loading: submitting, disabled: !isGoogleAvailable };
};
