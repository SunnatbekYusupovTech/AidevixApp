import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { gradients } from './gradients';
import { radii } from './radii';
import { spacing } from './spacing';
import { typography } from './typography';

type ThemeMode = 'light' | 'dark' | 'amoled';

export interface ThemeContextType {
  colors: typeof colors.dark;
  gradients: typeof gradients.dark;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: colors.dark,
  gradients: gradients.dark,
  spacing,
  typography,
  radii,
  isDark: true,
  themeMode: 'dark',
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = useColorScheme();
  // Default: 'dark' — foydalanuvchi keyin sozlamalardan o'zgartirishi mumkin
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  
  const isDark = themeMode === 'dark' || themeMode === 'amoled';
  
  const theme = {
    colors: themeMode === 'amoled' ? colors.amoled : (themeMode === 'light' ? colors.light : colors.dark),
    gradients: themeMode === 'amoled' ? gradients.amoled : (themeMode === 'light' ? gradients.light : gradients.dark),
    spacing,
    typography,
    radii,
    isDark,
    themeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
