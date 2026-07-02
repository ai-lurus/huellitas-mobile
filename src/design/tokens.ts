import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F6FAFA',
  /** Fondo tipo app (Mis mascotas / home) */
  backgroundApp: '#F6FAFA',
  surface: '#FFFFFF',
  primary: '#0B5369',
  primaryDark: '#083E4D',
  /** Texto / acentos de navegación activa (Inicio, Alerta…) */
  navActive: '#0B5369',
  textPrimary: '#0F2933',
  textSecondary: '#5C7480',
  textMuted: 'rgba(15,41,51,0.42)',
  border: '#DCE6E9',
  danger: '#FF4B4B',
  dangerDark: '#C62828',
  dangerSoft: '#FFEDED',
  dangerIcon: '#D32F2F',
  success: '#00785B',
  successIcon: '#00785B',
  iconMuted: '#5C7480',
  google: '#4285F4',
  accent: '#00785B',
  /** Caja info límite mascotas */
  infoBorder: '#0B5369',
  infoBackground: 'rgba(11,83,105,0.06)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  xxl: 36,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  button: 14,
  full: 100,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as TextStyle['fontWeight'] },
  heading: { fontSize: 20, fontWeight: '700' as TextStyle['fontWeight'] },
  body: { fontSize: 14, fontWeight: '400' as TextStyle['fontWeight'] },
  bodyStrong: { fontSize: 14, fontWeight: '700' as TextStyle['fontWeight'] },
  label: { fontSize: 13, fontWeight: '700' as TextStyle['fontWeight'] },
  button: { fontSize: 16, fontWeight: '700' as TextStyle['fontWeight'] },
  caption: { fontSize: 12, fontWeight: '400' as TextStyle['fontWeight'] },
} as const;

export const control = {
  minHeight: 50,
  icon: 18,
  iconLg: 22,
  logo: 48,
  ringWidth: 1.5,
} as const;

export const shadows: {
  none: ViewStyle;
  md: ViewStyle;
  button: ViewStyle;
} = {
  none: {},
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
};
