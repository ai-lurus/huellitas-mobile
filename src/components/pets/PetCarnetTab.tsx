import React, { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, control, radius, spacing, typography } from '../../design/tokens';
import {
  computeVaccineStatus,
  sortVaccinesByAppliedDateDesc,
  type PetDocuments,
  type Vaccine,
} from '../../domain/petCarnet';
import { formatFullDate } from '../../utils/date.utils';

export interface PetCarnetTabProps {
  vaccines: readonly Vaccine[];
  documents: PetDocuments;
  onAddVaccine: (input: { name: string; appliedAt: Date; nextDoseAt: Date | null }) => void;
  onDeleteVaccine: (vaccineId: string) => void;
  onSaveMicrochipNumber: (microchipNumber: string | null) => void;
}

export function PetCarnetTab({
  vaccines,
  documents,
  onAddVaccine,
  onDeleteVaccine,
  onSaveMicrochipNumber,
}: PetCarnetTabProps): React.ReactElement {
  const [addVaccineOpen, setAddVaccineOpen] = useState(false);
  const [editMicrochipOpen, setEditMicrochipOpen] = useState(false);
  const sorted = sortVaccinesByAppliedDateDesc(vaccines);

  const confirmDeleteVaccine = (vaccine: Vaccine): void => {
    Alert.alert('¿Eliminar vacuna?', `Se eliminará "${vaccine.name}" del carnet.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: (): void => onDeleteVaccine(vaccine.id) },
    ]);
  };

  return (
    <View style={styles.root} testID="petProfile.tab.carnet.content">
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vacunas</Text>
        <Pressable
          testID="petCarnet.addVaccine"
          onPress={() => setAddVaccineOpen(true)}
          style={styles.addLink}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addLinkText}>Agregar vacuna</Text>
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyCard} testID="petCarnet.vaccines.empty">
          <Ionicons name="medkit-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>Aún no hay vacunas registradas</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {sorted.map((vaccine, idx) => {
            const status = computeVaccineStatus(vaccine);
            return (
              <View
                key={vaccine.id}
                style={[styles.vaccineRow, idx > 0 ? styles.rowDivider : null]}
                testID={`petCarnet.vaccine.${vaccine.id}`}
              >
                <View style={styles.vaccineInfo}>
                  <Text style={styles.vaccineName}>{vaccine.name}</Text>
                  <Text style={styles.vaccineDate}>{formatFullDate(vaccine.appliedAt)}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    status === 'overdue' ? styles.statusPillOverdue : styles.statusPillOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      status === 'overdue' ? styles.statusPillTextOverdue : null,
                    ]}
                  >
                    {status === 'overdue' ? 'Vencida' : 'Al día'}
                  </Text>
                </View>
                <Pressable
                  testID={`petCarnet.vaccine.${vaccine.id}.delete`}
                  onPress={() => confirmDeleteVaccine(vaccine)}
                  style={styles.deleteIcon}
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar ${vaccine.name}`}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Documentos</Text>
      </View>

      <View style={styles.card}>
        <Pressable
          testID="petCarnet.certificate"
          onPress={() =>
            Alert.alert('Certificado', 'Aún no hay un certificado cargado para esta mascota.')
          }
          style={styles.docRow}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.docLabel}>Certificado PDF</Text>
          <Text style={styles.docAction}>Ver</Text>
        </Pressable>
        <View style={[styles.docRow, styles.rowDivider]}>
          <Ionicons name="hardware-chip-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.docLabel}>Microchip</Text>
          <Text style={styles.docValue}>{documents.microchipNumber ?? 'No registrado'}</Text>
        </View>
      </View>

      <Pressable
        testID="petCarnet.editCarnet"
        onPress={() => setEditMicrochipOpen(true)}
        style={styles.editCarnetBtn}
        accessibilityRole="button"
      >
        <Text style={styles.editCarnetBtnText}>Editar carnet</Text>
      </Pressable>

      <AddVaccineModal
        visible={addVaccineOpen}
        onClose={() => setAddVaccineOpen(false)}
        onSave={(input) => {
          onAddVaccine(input);
          setAddVaccineOpen(false);
        }}
      />

      <EditMicrochipModal
        visible={editMicrochipOpen}
        initialValue={documents.microchipNumber}
        onClose={() => setEditMicrochipOpen(false)}
        onSave={(value) => {
          onSaveMicrochipNumber(value);
          setEditMicrochipOpen(false);
        }}
      />
    </View>
  );
}

function AddVaccineModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (input: { name: string; appliedAt: Date; nextDoseAt: Date | null }) => void;
}): React.ReactElement {
  const [name, setName] = useState('');
  const [appliedAt, setAppliedAt] = useState(new Date());
  const [nextDoseAt, setNextDoseAt] = useState<Date | null>(null);
  const [showAppliedPicker, setShowAppliedPicker] = useState(false);
  const [showNextDosePicker, setShowNextDosePicker] = useState(false);

  const canSave = name.trim().length > 0;

  const reset = (): void => {
    setName('');
    setAppliedAt(new Date());
    setNextDoseAt(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Agregar vacuna</Text>

          <Text style={styles.inputLabel}>Nombre de la vacuna *</Text>
          <TextInput
            testID="petCarnet.vaccineForm.name"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Rabia"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Fecha de aplicación *</Text>
          <Pressable
            testID="petCarnet.vaccineForm.appliedAt"
            onPress={() => setShowAppliedPicker(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{formatFullDate(appliedAt.toISOString())}</Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          {showAppliedPicker ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="date"
              value={appliedAt}
              maximumDate={new Date()}
              onChange={(e: DateTimePickerEvent, d?: Date): void => {
                setShowAppliedPicker(Platform.OS === 'ios');
                if (d) setAppliedAt(d);
              }}
            />
          ) : null}

          <Text style={styles.inputLabel}>Próxima dosis (opcional)</Text>
          <Pressable
            testID="petCarnet.vaccineForm.nextDoseAt"
            onPress={() => setShowNextDosePicker(true)}
            style={styles.select}
          >
            <Text style={nextDoseAt ? styles.selectText : styles.selectPlaceholder}>
              {nextDoseAt ? formatFullDate(nextDoseAt.toISOString()) : 'Selecciona'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          {showNextDosePicker ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode="date"
              value={nextDoseAt ?? new Date()}
              onChange={(e: DateTimePickerEvent, d?: Date): void => {
                setShowNextDosePicker(Platform.OS === 'ios');
                if (d) setNextDoseAt(d);
              }}
            />
          ) : null}

          <View style={styles.modalActions}>
            <Pressable
              testID="petCarnet.vaccineForm.cancel"
              onPress={() => {
                reset();
                onClose();
              }}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="petCarnet.vaccineForm.save"
              disabled={!canSave}
              onPress={() => {
                onSave({ name: name.trim(), appliedAt, nextDoseAt });
                reset();
              }}
              style={[styles.modalSaveBtn, !canSave ? styles.modalSaveBtnDisabled : null]}
            >
              <Text style={styles.modalSaveText}>Guardar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditMicrochipModal({
  visible,
  initialValue,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialValue: string | null;
  onClose: () => void;
  onSave: (value: string | null) => void;
}): React.ReactElement {
  const [value, setValue] = useState(initialValue ?? '');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Editar carnet</Text>
          <Text style={styles.inputLabel}>Número de microchip</Text>
          <TextInput
            testID="petCarnet.microchipForm.input"
            value={value}
            onChangeText={setValue}
            placeholder="Sin registrar"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Pressable
              testID="petCarnet.microchipForm.cancel"
              onPress={onClose}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="petCarnet.microchipForm.save"
              onPress={() => onSave(value.trim().length > 0 ? value.trim() : null)}
              style={styles.modalSaveBtn}
            >
              <Text style={styles.modalSaveText}>Guardar</Text>
            </Pressable>
          </View>
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
    marginTop: spacing.sm,
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

  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  vaccineInfo: { flex: 1 },
  vaccineName: { color: colors.textPrimary, ...typography.bodyStrong },
  vaccineDate: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  statusPillOk: { backgroundColor: '#DCF5E7' },
  statusPillOverdue: { backgroundColor: colors.dangerSoft },
  statusPillText: { color: colors.success, ...typography.caption, fontWeight: '700' },
  statusPillTextOverdue: { color: colors.dangerDark },
  deleteIcon: { padding: spacing.xs },

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

  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  docLabel: { flex: 1, color: colors.textPrimary, ...typography.body },
  docAction: { color: colors.primary, ...typography.bodyStrong },
  docValue: { color: colors.textSecondary, ...typography.body },

  editCarnetBtn: {
    marginTop: spacing.sm,
    height: 50,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCarnetBtnText: { color: colors.textPrimary, ...typography.button },

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
  selectPlaceholder: { color: colors.textMuted, ...typography.body },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
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
});
