import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

function GlobalFallback({ error, resetErrorBoundary }: FallbackProps): React.JSX.Element {
  return (
    <View style={styles.root} testID="globalErrorBoundary.fallback">
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Oops, algo salió mal
        </Text>
        <Text style={styles.subtitle} numberOfLines={4}>
          {error?.message ?? 'Error inesperado'}
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="globalErrorBoundary.retry"
          onPress={resetErrorBoundary}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Reiniciar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function GlobalErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}): React.JSX.Element {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalFallback}
      onError={(error) => {
        onError?.(error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.md,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    height: 48,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
