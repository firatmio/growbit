import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Themes, type Theme } from './themes';

type ThemeContextValue = {
  theme: Theme;
  setThemeName: (name: keyof typeof Themes) => void;
  themeName: keyof typeof Themes;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'growbit:themeName';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeNameState] = useState<keyof typeof Themes>('Dark');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved && saved in Themes) {
          setThemeNameState(saved as keyof typeof Themes);
        }
      } catch {}
    })();
  }, []);

  const setThemeName = async (name: keyof typeof Themes) => {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem(THEME_KEY, name);
    } catch {}
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme: Themes[themeName],
    setThemeName,
    themeName,
  }), [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
