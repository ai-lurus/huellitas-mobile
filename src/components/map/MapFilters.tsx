import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReportSpeciesFilter } from '../../domain/lostReports';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface MapFiltersProps {
  selected: LostReportSpeciesFilter;
  activeCount: number;
  onChange: (next: LostReportSpeciesFilter) => void;
}

const FILTERS: Array<{ key: LostReportSpeciesFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'dog', label: 'Perro' },
  { key: 'cat', label: 'Gato' },
  { key: 'other', label: 'Otros' },
];

export function MapFilters({
  selected,
  activeCount,
  onChange,
}: MapFiltersProps): React.JSX.Element {
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
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.badge} testID="map.active-count">
        <Text style={styles.badgeLabel}>{activeCount} activos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
    paddingVertical: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
});
