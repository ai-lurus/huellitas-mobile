import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { colors, spacing, typography } from '../../../src/design/tokens';

export default function PetDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mascota</Text>
        <Text style={styles.subtitle}>ID: {id}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { color: colors.textPrimary, ...typography.heading },
  subtitle: { color: colors.textSecondary, ...typography.body, marginTop: spacing.sm },
});
