import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../design/tokens';

export interface SlotPickerProps {
  slots: string[];
  occupiedSlots: string[];
  selected: string | null;
  onSelect: (slotIso: string) => void;
  testID: string;
}

function formatSlot(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function SlotPicker({
  slots,
  occupiedSlots,
  selected,
  onSelect,
  testID,
}: SlotPickerProps): React.ReactElement {
  if (slots.length === 0) {
    return (
      <View testID={`${testID}.empty`}>
        <Text style={styles.emptyText}>No hay horarios disponibles por ahora.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {slots.map((slotIso) => {
        const isOccupied = occupiedSlots.includes(slotIso);
        const isSelected = selected === slotIso;
        const { day, time } = formatSlot(slotIso);
        return (
          <Pressable
            key={slotIso}
            disabled={isOccupied}
            onPress={(): void => onSelect(slotIso)}
            testID={`${testID}.slot.${slotIso}`}
            accessibilityState={{ disabled: isOccupied, selected: isSelected }}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : null,
              isOccupied ? styles.chipDisabled : null,
            ]}
          >
            <Text style={[styles.chipDay, isSelected ? styles.chipTextSelected : null]}>{day}</Text>
            <Text
              style={[
                styles.chipTime,
                isSelected ? styles.chipTextSelected : null,
                isOccupied ? styles.chipTextDisabled : null,
              ]}
            >
              {isOccupied ? 'Ocupado' : time}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  emptyText: { ...typography.body, color: colors.textSecondary },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 84,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.infoBackground },
  chipDisabled: { opacity: 0.5 },
  chipDay: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTime: { ...typography.bodyStrong, color: colors.textPrimary },
  chipTextSelected: { color: colors.primary },
  chipTextDisabled: { color: colors.textMuted },
});
