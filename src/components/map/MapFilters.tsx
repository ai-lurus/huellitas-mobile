import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReportSpeciesFilter } from '../../domain/lostReports';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface MapFiltersProps {
  selected: LostReportSpeciesFilter;
  onChange: (next: LostReportSpeciesFilter) => void;
}

const FILTERS: Array<{ key: LostReportSpeciesFilter; label: string; dotColor: string }> = [
  { key: 'all', label: 'Todos', dotColor: '#5E72E4' },
  { key: 'dog', label: 'Perdidos', dotColor: '#FF6B35' },
  { key: 'cat', label: 'Avistados', dotColor: '#3B82F6' },
  { key: 'other', label: 'Resueltos', dotColor: '#22C55E' },
];

export function MapFilters({ selected, onChange }: MapFiltersProps): React.JSX.Element {
  return (
    <View style={styles.container} testID="map.filters">
      <View style={styles.row}>
        {FILTERS.map((filter) => {
          const isSelected = filter.key === selected;
          return (
            <Pressable
              key={filter.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={(): void => onChange(filter.key)}
              style={[styles.chip, isSelected && styles.chipSelected]}
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
  chipSelected: {
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
