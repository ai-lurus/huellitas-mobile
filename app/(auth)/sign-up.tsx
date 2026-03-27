import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, spacing, typography } from '../../src/design/tokens';

export default function SignUpScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Ionicons
        name="person-outline"
        size={control.iconLg}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Pantalla pendiente de implementar.</Text>
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
  icon: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
