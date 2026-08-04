import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearAuthError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import FadeInView from '../../components/common/FadeInView';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { triggerHaptic } from '../../utils/haptics';

const LoginScreen = () => {
  const { colors, spacing, typography } = useTheme();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  // Boshqa auth ekranlardan qolgan eski xato xabarini tozalaymiz.
  // useFocusEffect — har safar ekranga qaytganda ham ishlaydi (mount paytidagi useEffect emas).
  useFocusEffect(
    React.useCallback(() => {
      dispatch(clearAuthError());
    }, [dispatch])
  );

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    triggerHaptic('light');
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data: any) => {
    try {
      await dispatch(login(data)).unwrap();
      // Muvaffaqiyat → RootNavigator isLoggedIn bo'yicha avtomatik o'tadi.
    } catch {
      // Barcha xatolar (jumladan email tasdiqlanmagan) authSlice.error orqali
      // ekranda inline tarzda ko'rsatiladi — avtomatik navigatsiya yo'q.
      triggerHaptic('error');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FadeInView delay={0} style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.brandLogoContainer}
          >
            <Ionicons name="code-working" size={48} color="#ffffff" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>Xush kelibsiz!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Aidevix — AI bilan dasturlashni o'rganing
          </Text>
        </FadeInView>

        <FadeInView delay={120} style={styles.form}>
          <Controller
            control={control}
            name="email"
            rules={{ required: 'Email kiriting' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="misol@mail.uz"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'Parol kiriting' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Parol"
                placeholder="********"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                rightIcon={
                  <TouchableOpacity onPress={togglePasswordVisibility} hitSlop={10}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword', { email: '' })}
            style={styles.forgotPass}
          >
            <Text style={{ color: colors.primary }}>Parolni unutdingizumi?</Text>
          </TouchableOpacity>

          {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

          <Button
            title="Kirish"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.loginButton}
          />

          <GoogleSignInButton />

          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary }}>Hali ro'yxatdan o'tmaganmisiz? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Ro'yxatdan o'tish</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandLogoContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});

export default LoginScreen;
