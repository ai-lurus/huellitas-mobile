import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { HomeReportCard } from '../../src/components/reports/HomeReportCard';
import { ReportCardSkeleton } from '../../src/components/reports/ReportCardSkeleton';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import type { LostReport } from '../../src/domain/lostReports';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);

  const [filter, setFilter] = useState<'all' | 'lost' | 'sighted' | 'resolved'>('all');

  const searchCenter = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const showReportsLoading =
    reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined;

  const allReports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);

  const filteredReports = useMemo(() => {
    if (filter === 'all') return allReports;
    return allReports.filter((r) => r.reportKind === filter);
  }, [allReports, filter]);

  const lostCount = useMemo(
    () => allReports.filter((r) => r.reportKind === 'lost').length,
    [allReports],
  );

  const openReport = useCallback(
    (id: string): void => {
      router.push(`/(app)/reports/${id}` as Href);
    },
    [router],
  );

  const filterChips = (
    <View style={styles.chipsRow} testID="home.filters">
      <FilterChip
        active={filter === 'all'}
        icon="apps"
        label="Todos"
        onPress={() => setFilter('all')}
        tone="purple"
        testID="home.filter.all"
      />
      <FilterChip
        active={filter === 'lost'}
        icon="alert-circle"
        label="Perdidos"
        onPress={() => setFilter('lost')}
        tone="lost"
        testID="home.filter.lost"
      />
      <FilterChip
        active={filter === 'sighted'}
        icon="eye"
        label="Avistados"
        onPress={() => setFilter('sighted')}
        tone="sighted"
        testID="home.filter.sighted"
      />
      <FilterChip
        active={filter === 'resolved'}
        icon="checkmark-circle"
        label="Resueltos"
        onPress={() => setFilter('resolved')}
        tone="resolved"
        testID="home.filter.resolved"
      />
    </View>
  );

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="Huellitas"
              source={require('../../assets/icon.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandText}>Huellitas</Text>
        </View>
        <View style={styles.actionsRow}>
          <Pressable accessibilityRole="button" style={styles.actionBtn} testID="home.search">
            <Ionicons name="search" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.actionBtn}
            testID="home.notifications"
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <View style={styles.dot} />
          </Pressable>
        </View>
      </View>

      {filterChips}

      <View style={styles.subRow} testID="home.subtitle">
        <Text style={styles.subRed}>{lostCount} mascotas perdidas</Text>
        <Text style={styles.subMuted}> cerca de ti</Text>
      </View>
    </View>
  );

  if (showReportsLoading) {
    return (
      <View style={styles.screen} testID="home.loading">
        {header}
        <View style={styles.listPadding}>
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="home.screen">
      <FlatList<LostReport>
        ListHeaderComponent={header}
        data={filteredReports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        refreshing={Boolean(reportsQuery.isRefetching)}
        onRefresh={() => void reportsQuery.refetch()}
        renderItem={({ item }) => (
          <HomeReportCard report={item} onPress={() => openReport(item.id)} />
        )}
        testID="home.list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  headerWrap: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 26, height: 26 },
  brandText: { ...typography.heading, color: colors.textPrimary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.backgroundApp,
  },

  chipsRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },

  subRow: { flexDirection: 'row', alignItems: 'center' },
  subRed: { ...typography.caption, color: colors.danger, fontWeight: '800' },
  subMuted: { ...typography.caption, color: colors.textMuted },

  listPadding: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});

function FilterChip({
  active,
  icon,
  label,
  onPress,
  tone,
  testID,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone: 'purple' | 'lost' | 'sighted' | 'resolved';
  testID: string;
}): React.JSX.Element {
  const palette = useMemo(() => {
    if (tone === 'lost') return { activeText: colors.navActive };
    if (tone === 'sighted') return { activeText: '#2563EB' };
    if (tone === 'resolved') return { activeText: colors.success };
    return { activeText: colors.primary };
  }, [tone]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={[
        stylesChip.chip,
        active
          ? { backgroundColor: colors.surface, borderColor: palette.activeText }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={14} color={active ? palette.activeText : colors.textMuted} />
      <Text style={[stylesChip.label, { color: active ? palette.activeText : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const stylesChip = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { ...typography.caption, fontWeight: '700' },
});
