import React from 'react';
import Toast, { BaseToast, ErrorToast, type ToastConfig } from 'react-native-toast-message';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: colors.success,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.md,
      ]}
      contentContainerStyle={{ paddingHorizontal: spacing.md }}
      text1Style={{ ...typography.bodyStrong, color: colors.textPrimary }}
      text2Style={{ ...typography.caption, color: colors.textSecondary }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: colors.primary,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.md,
      ]}
      contentContainerStyle={{ paddingHorizontal: spacing.md }}
      text1Style={{ ...typography.bodyStrong, color: colors.textPrimary }}
      text2Style={{ ...typography.caption, color: colors.textSecondary }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[
        {
          borderLeftColor: colors.danger,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadows.md,
      ]}
      contentContainerStyle={{ paddingHorizontal: spacing.md }}
      text1Style={{ ...typography.bodyStrong, color: colors.textPrimary }}
      text2Style={{ ...typography.caption, color: colors.textSecondary }}
    />
  ),
};

export function HuellitasToast(): React.JSX.Element {
  return <Toast config={toastConfig} position="top" topOffset={spacing.lg} visibilityTime={4000} />;
}
