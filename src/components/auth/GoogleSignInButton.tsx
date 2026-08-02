import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import Button from '../common/Button';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

interface Props {
  referralCode?: string;
  label?: string;
}

// "yoki" ajratgich + Google tugmasi. Login va Register ekranlarida qayta ishlatiladi.
// Expo Go'da native modul mavjud emas — tugma disabled bo'ladi va matn o'zgaradi.
const GoogleSignInButton = ({ referralCode, label = 'Google bilan davom etish' }: Props) => {
  const { colors } = useTheme();
  const { signIn, loading, disabled } = useGoogleAuth(referralCode);

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>yoki</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <Button
        title={disabled ? 'Google (faqat EAS build)' : label}
        variant="outline"
        onPress={signIn}
        loading={loading}
        disabled={disabled}
        icon={<Ionicons name="logo-google" size={18} color={disabled ? colors.textSecondary : colors.primary} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
});

export default GoogleSignInButton;
