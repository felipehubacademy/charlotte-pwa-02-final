// lib/theme.tsx
// ThemeProvider centralizado — suporta light/dark baseado no sistema.
// Uso: const { colors, isDark } = useTheme();

import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

// ── Paletas ──────────────────────────────────────────────────────────────────

export interface ThemeColors {
  bg:         string;
  card:       string;
  navy:       string;
  navyMid:    string;
  navyLight:  string;
  navyGhost:  string;
  green:      string;
  greenDark:  string;
  greenBg:    string;
  blue:       string;
  blueBg:     string;
  pink:       string;
  pinkBg:     string;
  orange:     string;
  gold:       string;
  shadow:     string;
  error:      string;
  border:     string;
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;
}

export const lightColors: ThemeColors = {
  bg:         '#F4F3FA',
  card:       '#FFFFFF',
  navy:       '#16153A',
  navyMid:    '#4B4A72',
  navyLight:  '#9896B8',
  navyGhost:  'rgba(22,21,58,0.06)',
  green:      '#A3FF3C',
  greenDark:  '#3D8800',
  greenBg:    '#F0FFD9',
  blue:       '#60A5FA',
  blueBg:     '#EFF6FF',
  pink:       '#F472B6',
  pinkBg:     '#FDF2F8',
  orange:     '#FF6B35',
  gold:       '#F59E0B',
  shadow:     'rgba(22,21,58,0.08)',
  error:      '#EF4444',
  border:     'rgba(22,21,58,0.07)',
  textPrimary:   '#16153A',
  textSecondary: '#4B4A72',
  textMuted:     '#9896B8',
};

export const darkColors: ThemeColors = {
  bg:         '#0D0C1D',
  card:       '#1A1938',
  navy:       '#EEEDF5',
  navyMid:    '#B8B6D0',
  navyLight:  '#6E6C8A',
  navyGhost:  'rgba(255,255,255,0.06)',
  green:      '#A3FF3C',
  greenDark:  '#8AE025',
  greenBg:    'rgba(163,255,60,0.10)',
  blue:       '#60A5FA',
  blueBg:     'rgba(96,165,250,0.10)',
  pink:       '#F472B6',
  pinkBg:     'rgba(244,114,182,0.10)',
  orange:     '#FF6B35',
  gold:       '#F59E0B',
  shadow:     'rgba(0,0,0,0.3)',
  error:      '#F87171',
  border:     'rgba(255,255,255,0.08)',
  textPrimary:   '#EEEDF5',
  textSecondary: '#B8B6D0',
  textMuted:     '#6E6C8A',
};

// ── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark mode desativado — app desenhado exclusivamente em light theme.
  // Quando dark mode estiver totalmente implementado em todos os componentes, reativar.
  return (
    <ThemeContext.Provider value={{ colors: lightColors, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
