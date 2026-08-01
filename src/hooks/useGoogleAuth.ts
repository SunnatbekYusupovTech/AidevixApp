import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

/**
 * Google bilan kirish hook'i (@react-native-google-signin asosida).
 *
 * Native Android dialog orqali ishlaydi. Google Cloud Console'da
 * Android OAuth client yaratilgan bo'lishi SHART va SHA-1 fingerprint
 * EAS keystore bilan mos kelishi kerak.
 *
 * Flow:
 *   1. GoogleSignin.signIn() → native Android account picker ochiladi
 *   2. Foydalanuvchi akkauntini tanlaydi
 *   3. id_token qaytadi
 *   4. dispatch(googleLogin()) → backend /auth/google ga yuboriladi
 */
export const useGoogleAuth = (referralCode?: string) => {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  // GoogleSignin ni bir marta konfiguratsiya qilish.
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleConfig.webClientId,
      iosClientId: googleConfig.iosClientId,
      offlineAccess: false,
    });
    console.log('[GOOGLE-AUTH] Configured:', {
      webClientId: googleConfig.webClientId,
      androidClientId: googleConfig.androidClientId,
    });
  }, []);

  const signIn = useCallback(async () => {
    try {
      triggerHaptic('light');
      setSubmitting(true);

      // Google Play Services mavjudligini tekshiramiz.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Native Android account picker ochiladi.
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken ?? (userInfo as any)?.idToken;

      if (!idToken) {
        triggerHaptic('error');
        console.warn('[GOOGLE-AUTH] id_token topilmadi');
        Alert.alert(
          'Google kirish',
          'Google hisob maʼlumotlari olinmadi. Iltimos, qaytadan urinib ko\'ring.'
        );
        return;
      }

      // id_token ni backendga yuboramiz.
      await dispatch(googleLogin({ idToken, referralCode })).unwrap();
    } catch (error: any) {
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        console.warn('[GOOGLE-AUTH] Xato:', error?.message ?? error, error?.response?.data);
        triggerHaptic('error');
      }
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, referralCode]);

  return { signIn, loading: submitting, disabled: false };
};
