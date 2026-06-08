import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReportSpeciesFilter, MapReportTypeFilter } from '../../domain/lostReports';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface MapFiltersProps {
  selected: LostReportSpeciesFilter;
  onChange: (next: LostReportSpeciesFilter) => void;
  selectedType: MapReportTypeFilter;
  onChangeType: (next: MapReportTypeFilter) => void;
}

const SPECIES_FILTERS: Array<{ key: LostReportSpeciesFilter; label: string; dotColor: string }> = [
  { key: 'all', label: 'Todos', dotColor: '#5E72E4' },
  { key: 'dog', label: 'Perros', dotColor: '#FF6B35' },
  { key: 'cat', label: 'Gatos', dotColor: '#3B82F6' },
  { key: 'other', label: 'Otros', dotColor: '#22C55E' },
];

const TYPE_FILTERS: Array<{ key: MapReportTypeFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'lost', label: 'Buscando' },
  { key: 'stray', label: 'Vistos' },
];

export function MapFilters({
  selected,
  onChange,
  selectedType,
  onChangeType,
}: MapFiltersProps): React.JSX.Element {
  return (
    <View style={styles.container} testID="map.filters">
      <View style={styles.row}>
        {TYPE_FILTERS.map((filter) => {
          const isSelected = filter.key === selectedType;
          return (
            <Pressable
              key={filter.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={(): void => onChangeType(filter.key)}
              style={[styles.chip, isSelected && styles.chipTypeSelected]}
              testID={`map.filter.type.${filter.key}`}
            >
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedType !== 'stray' ? (
        <View style={[styles.row, styles.rowSecondary]}>
          {SPECIES_FILTERS.map((filter) => {
            const isSelected = filter.key === selected;
            return (
              <Pressable
                key={filter.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={(): void => onChange(filter.key)}
                style={[styles.chip, isSelected && styles.chipSpeciesSelected]}
                testID={`map.filter.${filter.key}`}
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
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  rowSecondary: {
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipTypeSelected: {
    borderColor: colors.navActive,
    backgroundColor: colors.navActive,
  },
  chipSpeciesSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.white,
  },
});
