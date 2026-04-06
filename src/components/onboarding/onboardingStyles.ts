import { StyleSheet } from 'react-native';

import { colors, control, radius, shadows, spacing, typography } from '../../design/tokens';

export const onboardingStyles = StyleSheet.create({
  primaryButton: {
    minHeight: control.minHeight,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.button,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: colors.white,
    ...typography.button,
  },
  textLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    color: colors.primary,
    ...typography.bodyStrong,
  },
  title: {
    color: colors.textPrimary,
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rationaleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.xxs,
  },
  rationaleText: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.body,
  },
});
