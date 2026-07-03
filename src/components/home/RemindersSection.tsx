import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { HomeReminder } from '../../domain/homeTasks';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { formatFutureDueLabel } from '../../utils/date.utils';

export interface RemindersSectionProps {
  reminders: readonly HomeReminder[];
  onReminderPress: (reminder: HomeReminder) => void;
  testID?: string;
}

// Si no hay recordatorios, la sección completa se omite (no se muestra vacía).
export function RemindersSection({
  reminders,
  onReminderPress,
  testID = 'home.reminders',
}: RemindersSectionProps): React.JSX.Element | null {
  if (reminders.length === 0) return null;

  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.title}>Recordatorios</Text>
      {reminders.map((reminder) => (
        <Pressable
          key={reminder.id}
          style={styles.row}
          onPress={() => onReminderPress(reminder)}
          testID={`home.reminders.item.${reminder.id}`}
        >
          <View style={styles.icon}>
            <Ionicons name={reminder.icon} size={16} color={colors.primary} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {reminder.title}
            </Text>
            <Text style={styles.rowDue}>{formatFutureDueLabel(reminder.dueAt)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    ...shadows.md,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.infoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  rowTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  rowDue: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
