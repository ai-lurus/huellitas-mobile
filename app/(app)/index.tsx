import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AlertMarker } from '../../src/components/map/AlertMarker';
import { HuellitasMap } from '../../src/components/map/HuellitasMap';
import { MapFilters } from '../../src/components/map/MapFilters';
import type { LostReport, LostReportSpeciesFilter } from '../../src/domain/lostReports';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const [selectedSpecies, setSelectedSpecies] = useState<LostReportSpeciesFilter>('all');

  const reportsQuery = useLostReports({
    lat: currentLocation?.lat ?? Number.NaN,
    lng: currentLocation?.lng ?? Number.NaN,
    radius: alertRadiusKm,
  });

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

  return (
    <HuellitasMap>
      {filteredReports.map((report: LostReport) => (
        <AlertMarker key={report.id} onPressCallout={openReport} report={report} />
      ))}

      <MapFilters
        activeCount={filteredReports.length}
        onChange={setSelectedSpecies}
        selected={selectedSpecies}
      />

      {reportsQuery.isPending ? (
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
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 96,
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
    left: spacing.md,
    right: spacing.md,
    bottom: 96,
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
});
