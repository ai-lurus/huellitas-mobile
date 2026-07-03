import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, control, radius, spacing, typography } from '../../design/tokens';
import {
  FREQUENCY_LABELS,
  FREQUENCY_ORDER,
  isTaskOverdue,
  sortRoutineTasks,
  type RoutineTask,
  type TaskFrequency,
} from '../../domain/petRoutine';
import { formatTaskDueLabel } from '../../utils/date.utils';

export interface RoutineTaskFormValues {
  title: string;
  description: string | null;
  frequency: TaskFrequency;
  dueAt: Date;
}

export interface PetRutinaTabProps {
  tasks: readonly RoutineTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (values: RoutineTaskFormValues) => void;
  onEditTask: (taskId: string, values: RoutineTaskFormValues) => void;
  onDeleteTask: (taskId: string) => void;
}

export function PetRutinaTab({
  tasks,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: PetRutinaTabProps): React.ReactElement {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);

  // PRD §4.5: al completarse, la tarea sale de "Próximas tareas".
  const pending = sortRoutineTasks(tasks.filter((t) => !t.completed));

  const openTaskDetail = (task: RoutineTask): void => {
    Alert.alert(task.title, undefined, [
      { text: 'Editar', onPress: (): void => setEditingTask(task) },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: (): void =>
          Alert.alert('¿Eliminar tarea?', `Se eliminará "${task.title}" de la rutina.`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: (): void => onDeleteTask(task.id) },
          ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root} testID="petProfile.tab.rutina.content">
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Próximas tareas ({pending.length})</Text>
        <Pressable
          testID="petRutina.addTask"
          onPress={() => setFormOpen(true)}
          style={styles.addLink}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addLinkText}>Agregar tarea</Text>
        </Pressable>
      </View>

      {pending.length === 0 ? (
        <View style={styles.emptyCard} testID="petRutina.tasks.empty">
          <Ionicons name="checkmark-done-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>Sin tareas pendientes por ahora</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {pending.map((task, idx) => {
            const overdue = isTaskOverdue(task);
            return (
              <View
                key={task.id}
                style={[styles.taskRow, idx > 0 ? styles.rowDivider : null]}
                testID={`petRutina.task.${task.id}`}
              >
                <Pressable
                  testID={`petRutina.task.${task.id}.checkbox`}
                  onPress={() => onToggleTask(task.id)}
                  style={styles.checkbox}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: false }}
                  accessibilityLabel={`Marcar ${task.title} como completada`}
                >
                  <Ionicons name="ellipse-outline" size={24} color={colors.textMuted} />
                </Pressable>
                <Pressable
                  style={styles.taskInfo}
                  onPress={() => openTaskDetail(task)}
                  testID={`petRutina.task.${task.id}.open`}
                >
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMetaRow}>
                    <Text style={[styles.taskDue, overdue ? styles.taskDueOverdue : null]}>
                      {overdue ? 'Vencida · ' : ''}
                      {formatTaskDueLabel(task.dueAt)}
                    </Text>
                    <View style={styles.freqPill}>
                      <Text style={styles.freqPillText}>{FREQUENCY_LABELS[task.frequency]}</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <TaskFormModal
        visible={formOpen || editingTask !== null}
        initial={editingTask}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSave={(values) => {
          if (editingTask) {
            onEditTask(editingTask.id, values);
          } else {
            onAddTask(values);
          }
          setFormOpen(false);
          setEditingTask(null);
        }}
      />
    </View>
  );
}

function TaskFormModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: RoutineTask | null;
  onClose: () => void;
  onSave: (values: RoutineTaskFormValues) => void;
}): React.ReactElement {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequency, setFrequency] = useState<TaskFrequency>(initial?.frequency ?? 'once');
  const [dueAt, setDueAt] = useState<Date>(initial ? new Date(initial.dueAt) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setFrequency(initial?.frequency ?? 'once');
    setDueAt(initial ? new Date(initial.dueAt) : new Date());
  }, [visible, initial]);

  const canSave = title.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{initial ? 'Editar tarea' : 'Agregar tarea'}</Text>

          <Text style={styles.inputLabel}>Título *</Text>
          <TextInput
            testID="petRutina.taskForm.title"
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Paseo matutino"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Descripción (opcional)</Text>
          <TextInput
            testID="petRutina.taskForm.description"
            value={description}
            onChangeText={setDescription}
            placeholder="Detalles adicionales"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Frecuencia *</Text>
          <Pressable
            testID="petRutina.taskForm.frequency"
            onPress={() => setShowFrequencyPicker(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{FREQUENCY_LABELS[frequency]}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.inputLabel}>Próxima fecha *</Text>
          <Pressable
            testID="petRutina.taskForm.dueAt"
            onPress={() => setShowDatePicker(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{formatTaskDueLabel(dueAt.toISOString())}</Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="datetime"
              value={dueAt}
              onChange={(e: DateTimePickerEvent, d?: Date): void => {
                setShowDatePicker(Platform.OS === 'ios');
                if (d) setDueAt(d);
              }}
            />
          ) : null}

          <View style={styles.modalActions}>
            <Pressable
              testID="petRutina.taskForm.cancel"
              onPress={onClose}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="petRutina.taskForm.save"
              disabled={!canSave}
              onPress={() =>
                onSave({
                  title: title.trim(),
                  description: description.trim().length > 0 ? description.trim() : null,
                  frequency,
                  dueAt,
                })
              }
              style={[styles.modalSaveBtn, !canSave ? styles.modalSaveBtnDisabled : null]}
            >
              <Text style={styles.modalSaveText}>Guardar</Text>
            </Pressable>
          </View>

          <Modal
            visible={showFrequencyPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFrequencyPicker(false)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setShowFrequencyPicker(false)}>
              <Pressable style={styles.modalCard} onPress={() => {}}>
                <Text style={styles.modalTitle}>Selecciona frecuencia</Text>
                {FREQUENCY_ORDER.map((freq) => {
                  const active = freq === frequency;
                  return (
                    <Pressable
                      key={freq}
                      testID={`petRutina.taskForm.frequency.${freq}`}
                      onPress={() => {
                        setFrequency(freq);
                        setShowFrequencyPicker(false);
                      }}
                      style={[styles.modalOption, active ? styles.modalOptionActive : null]}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          active ? styles.modalOptionTextActive : null,
                        ]}
                      >
                        {FREQUENCY_LABELS[freq]}
                      </Text>
                      {active ? (
                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </Pressable>
            </Pressable>
          </Modal>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.textPrimary, ...typography.heading, fontSize: 17 },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addLinkText: { color: colors.primary, ...typography.bodyStrong, fontSize: 14 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },

  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  checkbox: { padding: 2 },
  taskInfo: { flex: 1 },
  taskTitle: { color: colors.textPrimary, ...typography.bodyStrong },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  taskDue: { color: colors.textSecondary, ...typography.caption },
  taskDueOverdue: { color: colors.dangerDark, fontWeight: '700' },
  freqPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.infoBackground,
  },
  freqPillText: { color: colors.primary, ...typography.caption, fontSize: 11 },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: { color: colors.textSecondary, ...typography.body, textAlign: 'center' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  modalTitle: { color: colors.textPrimary, ...typography.heading, marginBottom: spacing.xs },
  inputLabel: { color: colors.textPrimary, ...typography.label, marginTop: spacing.xs },
  input: {
    minHeight: control.minHeight,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  select: {
    minHeight: control.minHeight,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: colors.textPrimary, ...typography.body },

  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { color: colors.textPrimary, ...typography.button },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: { opacity: 0.5 },
  modalSaveText: { color: colors.white, ...typography.button },

  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionActive: {},
  modalOptionText: { color: colors.textPrimary, ...typography.body },
  modalOptionTextActive: { color: colors.primary, fontWeight: '700' },
});
