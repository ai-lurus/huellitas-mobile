import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#FAFAFA',
  /** Fondo tipo app (Mis mascotas / home) */
  backgroundApp: '#F9F8F6',
  surface: '#FFFFFF',
  primary: '#5E72E4',
  /** Texto / acentos de navegación activa (Inicio, Alerta…) */
  navActive: '#FF6B35',
  textPrimary: '#1E2A44',
  textSecondary: '#8E94A3',
  textMuted: 'rgba(60, 60, 70, 0.38)',
  border: '#E2E4E8',
  danger: '#E53935',
  dangerDark: '#991B1B',
  dangerSoft: '#FEF2F2',
  dangerIcon: '#D32F2F',
  success: '#43A047',
  successIcon: '#2E7D32',
  iconMuted: '#6B7280',
  google: '#4285F4',
  accent: '#FF8A34',
  /** Caja info límite mascotas */
  infoBorder: '#5E72E4',
  infoBackground: 'rgba(94, 114, 228, 0.06)',
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
