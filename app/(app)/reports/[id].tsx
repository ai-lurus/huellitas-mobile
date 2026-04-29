import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, spacing, typography } from '../../../src/design/tokens';

export default function ReportDetailPlaceholder(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={router.back}
          style={styles.backBtn}
        >
          <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.title}>Detalle del reporte</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>
        <Text style={styles.subtitle}>Reporte: {id}</Text>
        <Text style={styles.copy}>
          Este detalle se implementará en los próximos tickets del sprint.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, ...typography.heading },
  body: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  subtitle: { color: colors.textSecondary, ...typography.bodyStrong },
  copy: { color: colors.textSecondary, ...typography.body, lineHeight: 22 },
});
