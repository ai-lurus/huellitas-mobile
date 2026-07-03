import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { HomeTask } from '../../domain/homeTasks';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { formatTaskDueLabel } from '../../utils/date.utils';

const MAX_VISIBLE_TASKS = 4;

export interface TasksSectionProps {
  isLoading: boolean;
  hasPets: boolean;
  tasks: readonly HomeTask[];
  onTaskPress: (task: HomeTask) => void;
  onToggleTask: (taskId: string) => void;
  onAddFirstPet: () => void;
  onSeeMore: () => void;
  testID?: string;
}

export function TasksSection({
  isLoading,
  hasPets,
  tasks,
  onTaskPress,
  onToggleTask,
  onAddFirstPet,
  onSeeMore,
  testID = 'home.tasks',
}: TasksSectionProps): React.JSX.Element {
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const hiddenCount = tasks.length - visibleTasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tareas de hoy</Text>
        {hasPets && !isLoading && tasks.length > 0 && (
          <Text style={styles.counter}>
            {completedCount}/{tasks.length}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered} testID="home.tasks.loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !hasPets ? (
        <View style={styles.emptyState} testID="home.tasks.empty.no-pets">
          <Text style={styles.emptyText}>Aún no tienes mascotas registradas</Text>
          <Pressable
            style={styles.emptyButton}
            onPress={onAddFirstPet}
            testID="home.tasks.add-first-pet"
          >
            <Text style={styles.emptyButtonText}>Agregar mi primera mascota</Text>
          </Pressable>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState} testID="home.tasks.empty.no-tasks">
          <Text style={styles.emptyText}>Sin tareas pendientes por ahora</Text>
        </View>
      ) : (
        <>
          {visibleTasks.map((task) => (
            <View key={task.id} style={styles.taskRow} testID={`home.tasks.item.${task.id}`}>
              <Pressable
                onPress={() => onToggleTask(task.id)}
                style={styles.checkbox}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                testID={`home.tasks.checkbox.${task.id}`}
              >
                {task.completed ? (
                  <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                ) : (
                  <View style={styles.checkboxEmpty} />
                )}
              </Pressable>
              <Pressable
                style={styles.taskTextCol}
                onPress={() => onTaskPress(task)}
                testID={`home.tasks.item.${task.id}.press`}
              >
                <Text
                  style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <Text
                  style={[styles.taskDue, task.overdue && !task.completed && styles.taskDueOverdue]}
                >
                  {task.overdue && !task.completed ? 'Vencida · ' : ''}
                  {formatTaskDueLabel(task.dueAt)}
                </Text>
              </Pressable>
            </View>
          ))}
          {hiddenCount > 0 && (
            <Pressable style={styles.seeMoreRow} onPress={onSeeMore} testID="home.tasks.see-more">
              <Text style={styles.seeMoreText}>+{hiddenCount} más</Text>
            </Pressable>
          )}
        </>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counter: { ...typography.label, color: colors.success },
  centered: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyState: { paddingVertical: spacing.md, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyButtonText: { ...typography.button, color: colors.white },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkbox: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  checkboxEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  taskTextCol: { flex: 1 },
  taskTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  taskTitleDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  taskDue: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  taskDueOverdue: { color: colors.dangerDark, fontWeight: '700' },
  seeMoreRow: { alignItems: 'center', paddingTop: spacing.sm },
  seeMoreText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
