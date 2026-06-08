import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { StrayReport } from '../../domain/strayReports';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface StrayCardProps {
  report: StrayReport;
  onPress: () => void;
}

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
};

export function StrayCard({ report, onPress }: StrayCardProps): React.JSX.Element {
  const label = SPECIES_LABELS[report.species] ?? 'Animal';

  return (
    <Pressable onPress={onPress} style={styles.card} testID="stray-card">
      <View style={styles.iconWrap}>
        <Ionicons name="help-circle" size={28} color={colors.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{label} suelto</Text>
        {report.color != null && report.color.length > 0 ? (
          <Text style={styles.sub} numberOfLines={1}>
            Color: {report.color}
          </Text>
        ) : null}
        {report.description != null && report.description.length > 0 ? (
          <Text style={styles.desc} numberOfLines={2}>
            {report.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 138, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  desc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
