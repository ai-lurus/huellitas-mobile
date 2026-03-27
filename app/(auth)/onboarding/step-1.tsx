import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../../src/design/tokens';

export default function OnboardingStep1Screen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding</Text>
      <Text style={styles.subtitle}>Paso 1 — flujo pendiente de contenido.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    marginBottom: spacing.xs,
    color: colors.textPrimary,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
  },
});
