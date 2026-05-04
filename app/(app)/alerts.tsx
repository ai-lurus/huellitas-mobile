import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportCard } from '../../src/components/reports/ReportCard';
import { ReportCardSkeleton } from '../../src/components/reports/ReportCardSkeleton';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import type { LostReport } from '../../src/domain/lostReports';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

const SCREEN_W = Dimensions.get('window').width;
const BACK_BUTTON_BG = '#5E5CE6';
const HINT_BG = '#C8D0F8';

const RADIUS_OPTIONS: { km: number; label: string }[] = [
  { km: 2, label: '2 Km' },
  { km: 4, label: '4 Km' },
  { km: 6, label: '6 Km' },
  { km: 10, label: 'más de 8 Km' },
];

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
  const [distanceMenuOpen, setDistanceMenuOpen] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const filterRef = useRef<View>(null);

  const reportsQuery = useLostReports({
    lat: currentLocation?.lat ?? Number.NaN,
    lng: currentLocation?.lng ?? Number.NaN,
    radius: alertRadiusKm,
  });

  const sorted = useMemo(
    () => [...(reportsQuery.data ?? [])].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [reportsQuery.data],
  );

  const countLabel = useMemo(() => {
    if (reportsQuery.isPending) return '…';
    if (reportsQuery.isError) return '—';
    return String(sorted.length);
  }, [reportsQuery.isPending, reportsQuery.isError, sorted.length]);

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

  const measureFilter = useCallback((): void => {
    filterRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setFilterAnchor({ x, y, width, height });
      }
    });
  }, []);

  const onFilterLayout = (): void => {
    measureFilter();
  };

  const openDistanceMenu = useCallback((): void => {
    const measureAndOpen = (): void => {
      filterRef.current?.measureInWindow((x, y, width, height) => {
        const w = width > 0 ? width : 140;
        const h = height > 0 ? height : 40;
        const fallbackX = SCREEN_W - spacing.md - w;
        const fallbackY = Math.max(insets.top, spacing.sm) + 88;
        const hasLayout = width > 0 && height > 0;
        setFilterAnchor({
          x: hasLayout ? x : fallbackX,
          y: hasLayout ? y : fallbackY,
          width: w,
          height: h,
        });
        setDistanceMenuOpen(true);
      });
    };
    if (Platform.OS === 'web') {
      requestAnimationFrame(measureAndOpen);
    } else {
      measureAndOpen();
    }
  }, [insets.top]);

  const toggleDistanceMenu = useCallback((): void => {
    if (distanceMenuOpen) {
      setDistanceMenuOpen(false);
      return;
    }
    openDistanceMenu();
  }, [distanceMenuOpen, openDistanceMenu]);

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
        <View style={styles.filterAnchor}>
          <View ref={filterRef} collapsable={false} onLayout={onFilterLayout}>
            <Pressable
              onPress={toggleDistanceMenu}
              style={({ pressed }) => [styles.distChip, pressed && styles.distChipPressed]}
              testID="alerts.distance.trigger"
            >
              <Ionicons color={colors.textSecondary} name="options-outline" size={16} />
              <Text style={styles.distChipLabel}>Distancia</Text>
              <Ionicons color={colors.textSecondary} name="chevron-down" size={14} />
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.hintChip} testID="alerts.pull-hint">
        <Text style={styles.hintLabel}>Toca </Text>
        <Ionicons color={colors.primary} name="refresh" size={14} />
        <Text style={styles.hintLabel}> para actualizar</Text>
      </View>
    </View>
  );

  const dropdownRight =
    filterAnchor != null
      ? Math.max(spacing.md, SCREEN_W - filterAnchor.x - filterAnchor.width)
      : spacing.md;

  const distanceModal =
    distanceMenuOpen && filterAnchor != null ? (
      <Modal
        animationType="fade"
        onRequestClose={() => setDistanceMenuOpen(false)}
        transparent
        visible={true}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Cerrar menú"
            onPress={() => setDistanceMenuOpen(false)}
            style={styles.menuOverlay}
            testID="alerts.distance.overlay"
          />
          <View
            style={[
              styles.dropdown,
              {
                top: filterAnchor.y + filterAnchor.height + 6,
                right: dropdownRight,
              },
            ]}
            testID="alerts.distance.menu"
          >
            <Text style={styles.dropdownCaption}>Radio</Text>
            {RADIUS_OPTIONS.map((opt) => {
              const selected = alertRadiusKm === opt.km;
              return (
                <Pressable
                  key={opt.km}
                  onPress={() => {
                    setAlertRadius(opt.km);
                    setDistanceMenuOpen(false);
                  }}
                  style={[styles.dropdownRow, selected ? styles.dropdownRowActive : null]}
                  testID={`alerts.distance.option.${opt.km}`}
                >
                  <Text
                    style={[
                      styles.dropdownRowLabel,
                      selected ? styles.dropdownRowLabelActive : null,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    ) : null;

  if (reportsQuery.isPending) {
    return (
      <View style={styles.screen}>
        {distanceModal}
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
        {distanceModal}
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
        {distanceModal}
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
      {distanceModal}
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
  filterAnchor: {
    position: 'relative',
    zIndex: 120,
  },
  distChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  distChipPressed: { opacity: 0.9 },
  distChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
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
  modalRoot: {
    flex: 1,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },
  dropdown: {
    position: 'absolute',
    minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingBottom: 4,
  },
  dropdownRow: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  dropdownRowActive: {
    backgroundColor: '#ECEFF5',
  },
  dropdownRowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dropdownRowLabelActive: {
    fontWeight: '600',
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
