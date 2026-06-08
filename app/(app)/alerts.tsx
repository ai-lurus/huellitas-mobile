import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadiusDropdown } from '../../src/components/map/RadiusDropdown';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { ReportCardSkeleton } from '../../src/components/reports/ReportCardSkeleton';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import type { LostReport } from '../../src/domain/lostReports';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

const BACK_BUTTON_BG = '#5E5CE6';
const HINT_BG = '#C8D0F8';

function AlertsHeader({
  onBack,
  onRefresh,
  title,
}: {
  onBack: () => void;
  onRefresh: () => void;
  title: string;
}): React.ReactElement {
  return (
    <View style={styles.headerRow}>
      <Pressable
        accessibilityLabel="Volver"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.headerPressablePressed]}
        testID="alerts.back"
      >
        <Ionicons color={colors.white} name="arrow-back" size={20} />
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
      <Pressable
        accessibilityLabel="Actualizar lista"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onRefresh}
        style={({ pressed }) => [styles.refreshTap, pressed && styles.headerPressablePressed]}
        testID="alerts.refresh"
      >
        <Ionicons color={colors.navActive} name="refresh" size={22} />
      </Pressable>
    </View>
  );
}

export default function AlertsScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const setAlertRadius = useSettingsStore((s) => s.setAlertRadius);
  const searchCenter = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const showReportsLoading =
    reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined;

  const sorted = useMemo(
    () => [...(reportsQuery.data ?? [])].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [reportsQuery.data],
  );

  const countLabel = useMemo(() => {
    if (showReportsLoading) return '…';
    if (reportsQuery.isError) return '—';
    return String(sorted.length);
  }, [showReportsLoading, reportsQuery.isError, sorted.length]);

  const openReport = (id: string): void => {
    router.push(`/(app)/reports/${id}` as Href);
  };

  const goBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/' as Href);
  }, [router]);

  const headerTopPadding = Math.max(insets.top, spacing.sm);

  const listHeader = (
    <View style={[styles.topSection, { paddingTop: headerTopPadding }]}>
      <AlertsHeader
        onBack={goBack}
        onRefresh={() => void reportsQuery.refetch()}
        title="Reportes cercanos"
      />
      <View style={styles.subHeader}>
        <Text style={styles.countLabel}>{countLabel} reportes</Text>
        <RadiusDropdown
          value={alertRadiusKm}
          onChange={setAlertRadius}
          variant="list"
          testID="alerts.distance.trigger"
        />
      </View>
      <View style={styles.hintChip} testID="alerts.pull-hint">
        <Text style={styles.hintLabel}>Toca </Text>
        <Ionicons color={colors.primary} name="refresh" size={14} />
        <Text style={styles.hintLabel}> para actualizar</Text>
      </View>
    </View>
  );

  if (showReportsLoading) {
    return (
      <View style={styles.screen}>
        {listHeader}
        <View style={styles.containerGrow} testID="alerts.skeleton">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </View>
      </View>
    );
  }

  if (reportsQuery.isError) {
    return (
      <View style={styles.screen}>
        {listHeader}
        <View style={styles.centerBlock} testID="alerts.error">
          <Text style={styles.errorText}>No pudimos cargar alertas cerca de ti.</Text>
          <Pressable
            onPress={() => void reportsQuery.refetch()}
            style={styles.retryButton}
            testID="alerts.retry"
          >
            <Text style={styles.retryLabel}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.screen}>
        {listHeader}
        <View style={styles.centerBlock} testID="alerts.empty">
          <Text style={styles.emptyText}>No hay reportes en este radio.</Text>
          <Text style={styles.emptyHint}>Prueba ampliar la distancia o actualizar más tarde.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList<LostReport>
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        data={sorted}
        keyExtractor={(item) => item.id}
        onRefresh={() => void reportsQuery.refetch()}
        refreshing={Boolean(reportsQuery.isRefetching)}
        renderItem={({ item }) => <ReportCard onPress={() => openReport(item.id)} report={item} />}
        testID="alerts.list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  topSection: {
    backgroundColor: colors.backgroundApp,
    paddingBottom: spacing.xs,
  },
  headerRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BACK_BUTTON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPressablePressed: { opacity: 0.88 },
  headerTitle: {
    ...typography.heading,
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  refreshTap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  hintChip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HINT_BG,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
  },
  hintLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  containerGrow: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.backgroundApp,
  },
  centerBlock: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundApp,
  },
  emptyText: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    ...typography.caption,
    textAlign: 'center',
  },
  errorText: {
    color: colors.dangerDark,
    ...typography.bodyStrong,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryLabel: {
    color: colors.white,
    ...typography.bodyStrong,
  },
});
