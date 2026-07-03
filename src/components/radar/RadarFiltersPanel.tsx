import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReportSpeciesFilter, MapReportTypeFilter } from '../../domain/lostReports';
import { RADAR_DATE_RANGE_OPTIONS, type RadarDateRangeFilter } from '../../domain/radarFilters';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

export interface RadarFiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  typeFilter: MapReportTypeFilter;
  onChangeType: (next: MapReportTypeFilter) => void;
  speciesFilter: LostReportSpeciesFilter;
  onChangeSpecies: (next: LostReportSpeciesFilter) => void;
  dateRangeFilter: RadarDateRangeFilter;
  onChangeDateRange: (next: RadarDateRangeFilter) => void;
  onClear: () => void;
}

const TYPE_FILTERS: Array<{ key: MapReportTypeFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'lost', label: 'Perdido' },
  { key: 'stray', label: 'Encontrado' },
];

const SPECIES_FILTERS: Array<{ key: LostReportSpeciesFilter; label: string; dotColor: string }> = [
  { key: 'all', label: 'Todos', dotColor: colors.primary },
  { key: 'dog', label: 'Perros', dotColor: colors.danger },
  { key: 'cat', label: 'Gatos', dotColor: colors.primary },
  { key: 'other', label: 'Otros', dotColor: colors.accent },
];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export function RadarFiltersPanel({
  visible,
  onClose,
  typeFilter,
  onChangeType,
  speciesFilter,
  onChangeSpecies,
  dateRangeFilter,
  onChangeDateRange,
  onClear,
}: RadarFiltersPanelProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="radar.filters.backdrop">
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filtros</Text>
            <Pressable onPress={onClose} testID="radar.filters.close" hitSlop={8}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          <FilterSection title="Tipo">
            {TYPE_FILTERS.map((filter) => {
              const isSelected = filter.key === typeFilter;
              return (
                <Pressable
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onChangeType(filter.key)}
                  style={[styles.chip, isSelected && styles.chipTypeSelected]}
                  testID={`radar.filters.type.${filter.key}`}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </FilterSection>

          <FilterSection title="Especie">
            {SPECIES_FILTERS.map((filter) => {
              const isSelected = filter.key === speciesFilter;
              return (
                <Pressable
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onChangeSpecies(filter.key)}
                  style={[styles.chip, isSelected && styles.chipSpeciesSelected]}
                  testID={`radar.filters.species.${filter.key}`}
                >
                  {filter.key === 'all' ? null : (
                    <View style={[styles.dot, { backgroundColor: filter.dotColor }]} />
                  )}
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </FilterSection>

          <FilterSection title="Rango de fecha">
            {RADAR_DATE_RANGE_OPTIONS.map((filter) => {
              const isSelected = filter.key === dateRangeFilter;
              return (
                <Pressable
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onChangeDateRange(filter.key)}
                  style={[styles.chip, isSelected && styles.chipDateSelected]}
                  testID={`radar.filters.date.${filter.key}`}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </FilterSection>

          <View style={styles.footerRow}>
            <Pressable onPress={onClear} testID="radar.filters.clear" style={styles.clearBtn}>
              <Text style={styles.clearText}>Limpiar filtros</Text>
            </Pressable>
            <Pressable onPress={onClose} testID="radar.filters.apply" style={styles.applyBtn}>
              <Text style={styles.applyText}>Aplicar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.heading, color: colors.textPrimary },
  closeText: { ...typography.bodyStrong, color: colors.primary },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.label, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipTypeSelected: { borderColor: colors.navActive, backgroundColor: colors.navActive },
  chipSpeciesSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipDateSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { ...typography.caption, color: colors.textSecondary },
  chipLabelSelected: { color: colors.white, fontWeight: '600' },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { ...typography.bodyStrong, color: colors.textSecondary },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { ...typography.bodyStrong, color: colors.white },
});
