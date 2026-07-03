import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

export interface StreakCardProps {
  streakDays: number;
  testID?: string;
}

export function StreakCard({
  streakDays,
  testID = 'home.streak',
}: StreakCardProps): React.JSX.Element {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.textCol}>
        <Text style={styles.label}>Racha de cuidado</Text>
        <View style={styles.countRow}>
          <Text style={styles.count}>{streakDays}</Text>
          <Text style={styles.unit}>días seguidos</Text>
        </View>
      </View>
      <View style={styles.flameBadge}>
        <Ionicons name="flame" size={24} color={colors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    ...shadows.md,
  },
  textCol: { gap: spacing.xxs },
  label: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  count: { ...typography.title, color: colors.white },
  unit: { ...typography.body, color: 'rgba(255,255,255,0.85)' },
  flameBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
