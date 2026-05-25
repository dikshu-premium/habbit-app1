import { createContext, useContext } from 'react';
import { ColorSchemeName } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: 'light' | 'dark';
  colors: typeof COLORS.light;
  spacing: typeof SPACING;
  radius: typeof BORDER_RADIUS;
  fontSizes: typeof FONT_SIZES;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  colorScheme: 'light',
  colors: COLORS.light,
  spacing: SPACING,
  radius: BORDER_RADIUS,
  fontSizes: FONT_SIZES,
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function getColorsForScheme(scheme: ColorSchemeName) {
  return scheme === 'dark' ? COLORS.dark : COLORS.light;
}
