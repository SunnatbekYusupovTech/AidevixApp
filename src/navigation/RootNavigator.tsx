import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuth } from '../store/slices/authSlice';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import DailyChallengeScreen from '../screens/challenge/DailyChallengeScreen';
import { RootStackParamList } from './types';
import Loader from '../components/common/Loader';
import { useDailyCheckIn } from '../hooks/useDailyCheckIn';
import { useReminders } from '../hooks/useReminders';
import StreakCelebrationModal from '../components/gamification/StreakCelebrationModal';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// MUHIM: bu yerda global auth.loading ga qaramaymiz. Aks holda har bir login/register
// urinishi paytida NavigationContainer unmount bo'lib, navigation prop'i yo'qoladi
// (masalan, LoginScreen → VerifyEmail o'tishi ishlamay qoladi).
const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const { celebration, closeCelebration } = useDailyCheckIn();
  useReminders();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    dispatch(checkAuth()).finally(() => setInitialCheckDone(true));
  }, [dispatch]);

  if (!initialCheckDone) {
    return <Loader fullScreen />;
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="DailyChallenge"
                component={DailyChallengeScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StreakCelebrationModal
        visible={celebration.visible}
        streak={celebration.streak}
        variant={celebration.variant}
        onClose={closeCelebration}
      />
    </>
  );
};

export default RootNavigator;
