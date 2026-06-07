import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { AlertMarker } from '../../src/components/map/AlertMarker';
import { StrayMarker } from '../../src/components/map/StrayMarker';
import { HuellitasMap } from '../../src/components/map/HuellitasMap';
import { MapFilters } from '../../src/components/map/MapFilters';
import { Skeleton } from '../../src/components/skeleton/Skeleton';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import type { LostReport, LostReportSpeciesFilter } from '../../src/domain/lostReports';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useNearbyStrayReports } from '../../src/hooks/useStrayReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

import BRAND_LOGO from '../../assets/icon.png';

function showReportActionSheet(onLostPet: () => void, onStray: () => void): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancelar', 'Mascota perdida', 'Vi un animal suelto'],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) onLostPet();
        if (index === 2) onStray();
      },
    );
  } else {
    Alert.alert('Reportar', '¿Qué quieres reportar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Mascota perdida', onPress: onLostPet },
      { text: 'Vi un animal suelto', onPress: onStray },
    ]);
  }
}

export default function MapScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const [selectedSpecies, setSelectedSpecies] = useState<LostReportSpeciesFilter>('all');

  const searchCenter = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const strayQuery = useNearbyStrayReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const showReportsLoading =
    reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined;

  const filteredReports = useMemo(() => {
    const reports = reportsQuery.data ?? [];
    if (selectedSpecies === 'all') return reports;
    if (selectedSpecies === 'dog' || selectedSpecies === 'cat') {
      return reports.filter((r) => r.petSpecies === selectedSpecies);
    }
    return reports.filter((r) => r.petSpecies !== 'dog' && r.petSpecies !== 'cat');
  }, [reportsQuery.data, selectedSpecies]);

  const openReport = (reportId: string): void => {
    router.push(`/(app)/reports/${reportId}` as Href);
  };

  const openStray = (strayId: string): void => {
    router.push(`/(app)/stray/${strayId}` as Href);
  };

  const handleFab = (): void => {
    showReportActionSheet(
      () => router.push('/(app)/pets' as Href),
      () => router.push('/(app)/stray/new' as Href),
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="Huellitas"
              resizeMode="contain"
              source={BRAND_LOGO}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.brandLabel}>Huellitas</Text>
        </View>
        <View style={styles.actions}>
          <Ionicons color={colors.textPrimary} name="search" size={20} />
          <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
        </View>
      </View>

      <MapFilters onChange={setSelectedSpecies} selected={selectedSpecies} />

      <View style={styles.mapCard}>
        <HuellitasMap containerStyle={styles.mapInner} showCenterButton={false}>
          {showReportsLoading ? (
            <Skeleton style={StyleSheet.absoluteFillObject} borderRadius={18} />
          ) : null}

          <View style={styles.mapChips}>
            <View style={styles.smallChip}>
              <Ionicons color={colors.textSecondary} name="location" size={12} />
              <Text style={styles.smallChipLabel}>Colima, Colima</Text>
            </View>
            <View style={styles.smallChip}>
              <Ionicons color={colors.textSecondary} name="radio-outline" size={12} />
              <Text style={styles.smallChipLabel}>Radio de búsqueda</Text>
              <Ionicons color={colors.textSecondary} name="chevron-down" size={12} />
            </View>
          </View>

          {filteredReports.map((report: LostReport) => (
            <AlertMarker key={report.id} onPressCallout={openReport} report={report} />
          ))}

          {(strayQuery.data ?? []).map((stray) => (
            <StrayMarker key={`stray-${stray.id}`} report={stray} onPressCallout={openStray} />
          ))}

          {showReportsLoading ? (
            <View style={styles.overlay} testID="reports.loading">
              <Text style={styles.overlayLabel}>Cargando reportes cercanos...</Text>
            </View>
          ) : null}

          {reportsQuery.isError ? (
            <View style={styles.overlayError} testID="reports.error">
              <Text style={styles.overlayErrorLabel}>No pudimos cargar reportes cercanos.</Text>
            </View>
          ) : null}
        </HuellitasMap>
      </View>

      <Pressable onPress={handleFab} style={styles.fab} testID="map.fab">
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <View style={styles.legend}>
        <Text style={[styles.legendItem, { color: '#E11D48' }]}>● Perdido</Text>
        <Text style={[styles.legendItem, { color: '#3B82F6' }]}>● Avistado</Text>
        <Text style={[styles.legendItem, { color: '#22C55E' }]}>● Resuelto</Text>
        <Text style={[styles.legendItem, { color: '#FB7185' }]}>● Tú</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  topBar: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mapCard: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  mapInner: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  mapChips: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 20,
  },
  smallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  smallChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  overlay: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overlayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlayError: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overlayErrorLabel: {
    ...typography.caption,
    color: colors.dangerDark,
    textAlign: 'center',
  },
  legend: {
    marginTop: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundApp,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendItem: {
    ...typography.caption,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navActive,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
