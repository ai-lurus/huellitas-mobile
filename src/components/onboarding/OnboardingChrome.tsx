import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, control, radius, spacing, typography } from '../../design/tokens';

export interface OnboardingChromeProps {
  currentStep: 1 | 2 | 3;
  totalSteps?: number;
  onSkipAll: () => void;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  testID?: string;
}

const TOTAL = 3;

export function OnboardingChrome({
  currentStep,
  totalSteps = TOTAL,
  onSkipAll,
  showBack,
  onBack,
  children,
  footer,
  testID,
}: OnboardingChromeProps): React.JSX.Element {
  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {showBack && onBack ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onBack}
              style={styles.backBtn}
              testID="onboarding.back"
            >
              <Ionicons name="chevron-back" size={control.icon} color={colors.primary} />
              <Text style={styles.backText}>Atrás</Text>
            </Pressable>
          ) : null}
          <Text style={styles.stepLabel} testID="onboarding.stepLabel">
            {currentStep} de {totalSteps}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onSkipAll}
          testID="onboarding.skipAll"
        >
          <Text style={styles.link}>Omitir todo</Text>
        </Pressable>
      </View>

      <View style={styles.progressRow} testID="onboarding.progress">
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i < currentStep ? styles.progressActive : styles.progressInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.body}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    color: colors.primary,
    ...typography.bodyStrong,
  },
  stepLabel: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  link: {
    color: colors.primary,
    ...typography.bodyStrong,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.xs,
  },
  progressActive: {
    backgroundColor: colors.accent,
  },
  progressInactive: {
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
