import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import {
  fromLostReport,
  fromStrayReport,
  isActiveLostReport,
  isActiveStrayReport,
  matchesSpeciesFilter,
  matchesTypeFilter,
  type RadarListItem,
} from '../../domain/radarListItem';
import type { LostReportSpeciesFilter, MapReportTypeFilter } from '../../domain/lostReports';
import { isWithinDateRange, type RadarDateRangeFilter } from '../../domain/radarFilters';
import { colors, radius, spacing, typography } from '../../design/tokens';
import { distanceMeters } from '../../utils/geo';
import { useLostReports } from '../../hooks/useLostReports';
import { useNearbyStrayReports } from '../../hooks/useStrayReports';
import { RadarListItemCard } from './RadarListItemCard';
import { RadarListItemCardSkeleton } from './RadarListItemCardSkeleton';

type SortBy = 'distance' | 'recent';

export interface RadarListViewProps {
  searchCenter: { lat: number; lng: number };
  radiusKm: number;
  speciesFilter: LostReportSpeciesFilter;
  typeFilter: MapReportTypeFilter;
  dateRangeFilter: RadarDateRangeFilter;
  onOpenItem: (href: Href) => void;
}

export function RadarListView({
  searchCenter,
  radiusKm,
  speciesFilter,
  typeFilter,
  dateRangeFilter,
  onOpenItem,
}: RadarListViewProps): React.ReactElement {
  const [sortBy, setSortBy] = useState<SortBy>('distance');

  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: radiusKm,
  });
  const strayQuery = useNearbyStrayReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: radiusKm,
  });

  const isLoading =
    (reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined) ||
    (strayQuery.fetchStatus === 'fetching' && strayQuery.data === undefined);
  const isError = reportsQuery.isError && strayQuery.isError;

  const items = useMemo<RadarListItem[]>(() => {
    const lost = (reportsQuery.data ?? [])
      .filter(isActiveLostReport)
      .map((report) => fromLostReport(report));
    const stray = (strayQuery.data ?? [])
      .filter(isActiveStrayReport)
      .map((report) => fromStrayReport(report, distanceMeters(searchCenter, report)));

    const merged = [...lost, ...stray].filter(
      (item) =>
        matchesTypeFilter(item.kind, typeFilter) &&
        matchesSpeciesFilter(item.species, speciesFilter) &&
        isWithinDateRange(item.createdAt, dateRangeFilter),
    );

    return merged.sort((a, b) =>
      sortBy === 'distance'
        ? a.distanceMeters - b.distanceMeters
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [
    reportsQuery.data,
    strayQuery.data,
    searchCenter,
    typeFilter,
    speciesFilter,
    dateRangeFilter,
    sortBy,
  ]);

  const sortRow = (
    <View style={styles.sortRow} testID="radar.list.sort">
      <Pressable
        onPress={() => setSortBy('distance')}
        style={[styles.sortChip, sortBy === 'distance' && styles.sortChipActive]}
        testID="radar.list.sort.distance"
      >
        <Text style={[styles.sortLabel, sortBy === 'distance' && styles.sortLabelActive]}>
          Cercanía
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setSortBy('recent')}
        style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
        testID="radar.list.sort.recent"
      >
        <Text style={[styles.sortLabel, sortBy === 'recent' && styles.sortLabelActive]}>
          Más reciente
        </Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.wrap} testID="radar.list.loading">
        {sortRow}
        <View style={styles.listContent}>
          <RadarListItemCardSkeleton />
          <RadarListItemCardSkeleton />
          <RadarListItemCardSkeleton />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.wrap}>
        {sortRow}
        <View style={styles.centerBlock} testID="radar.list.error">
          <Ionicons color={colors.textMuted} name="cloud-offline-outline" size={40} />
          <Text style={styles.errorText}>No pudimos cargar el radar.</Text>
          <Pressable
            onPress={() => {
              void reportsQuery.refetch();
              void strayQuery.refetch();
            }}
            style={styles.retryButton}
            testID="radar.list.retry"
          >
            <Text style={styles.retryLabel}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        {sortRow}
        <View style={styles.centerBlock} testID="radar.list.empty">
          <Ionicons color={colors.textMuted} name="paw-outline" size={40} />
          <Text style={styles.emptyText}>No hay reportes activos en tu zona</Text>
          <Text style={styles.emptyHint}>Prueba ampliar la distancia o ajustar los filtros.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList<RadarListItem>
        ListHeaderComponent={sortRow}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => {
          void reportsQuery.refetch();
          void strayQuery.refetch();
        }}
        refreshing={Boolean(reportsQuery.isRefetching || strayQuery.isRefetching)}
        renderItem={({ item }) => (
          <RadarListItemCard item={item} onPress={() => onOpenItem(item.href)} />
        )}
        testID="radar.list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  sortRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  sortChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortLabel: { ...typography.caption, color: colors.textSecondary },
  sortLabelActive: { color: colors.white, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorText: { ...typography.bodyStrong, color: colors.textPrimary, textAlign: 'center' },
  emptyText: { ...typography.bodyStrong, color: colors.textPrimary, textAlign: 'center' },
  emptyHint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryLabel: { ...typography.bodyStrong, color: colors.white },
});
