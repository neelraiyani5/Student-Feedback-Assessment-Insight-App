import { rf } from '../utils/responsive';

export const COLORS = {
  primary: '#00ADB5', // Primary Blue
  secondary: '#FFC107',
  accent: '#F97316',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F3F4F6',
  surfaceLight: '#F9FAFB',
  
  // Text
  textPrimary: '#1F2937', // Gray-800
  textSecondary: '#6B7280', // Gray-500
  textLight: '#9CA3AF', // Gray-400
  textWhite: '#FFFFFF',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Borders
  border: '#E5E7EB',
  inputBorder: '#D1D5DB',

  // Neutrals
  white: '#FFFFFF',
  black: '#222831',
  secondaryBlack: '#393E46',
  teal: '#00ADB5',
  gray: '#EEEEEE',
  transparent: 'transparent',
};

export const FONTS = {
  // Sizes (using responsive font scaling)
  sizes: {
    h1: rf(32),
    h2: rf(24),
    h3: rf(20),
    body1: rf(16),
    body2: rf(14),
    caption: rf(12),
    small: rf(10),
  },
  
  // Weights
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Pre-defined Typography Styles
  h1: { fontSize: rf(32), fontWeight: '700', color: COLORS.textPrimary },
  h2: { fontSize: rf(24), fontWeight: '700', color: COLORS.textPrimary },
  h3: { fontSize: rf(20), fontWeight: '600', color: COLORS.textPrimary },
  body1: { fontSize: rf(16), fontWeight: '400', color: COLORS.textPrimary },
  body2: { fontSize: rf(14), fontWeight: '400', color: COLORS.textSecondary },
  caption: { fontSize: rf(12), fontWeight: '400', color: COLORS.textLight },
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const LAYOUT = {
  radius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 999,
  },
};

export default {};
