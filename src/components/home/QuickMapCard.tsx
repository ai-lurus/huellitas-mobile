import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReport } from '../../domain/lostReports';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { AlertMarker } from '../map/AlertMarker';
import { HuellitasMap } from '../map/HuellitasMap';

export interface QuickMapCardProps {
  reports: readonly LostReport[];
  isLoading: boolean;
  onSeeFullMap: () => void;
  testID?: string;
}

export function QuickMapCard({
  reports,
  isLoading,
  onSeeFullMap,
  testID = 'home.quickmap',
}: QuickMapCardProps): React.JSX.Element {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mapa rápido</Text>
        <Pressable onPress={onSeeFullMap} testID="home.quickmap.see-full">
          <Text style={styles.link}>Ver mapa completo</Text>
        </Pressable>
      </View>

      <View style={styles.mapFrame}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <HuellitasMap showCenterButton={false} containerStyle={styles.mapInner}>
            {reports.map((report) => (
              <AlertMarker
                key={report.id}
                report={report}
                onPressCallout={onSeeFullMap}
                interactive={false}
              />
            ))}
          </HuellitasMap>
        )}
        {/* Overlay captures the tap so the embedded MapView's own pan/zoom gestures
            never swallow it — the thumbnail is a link, not an interactive map. */}
        <Pressable
          style={styles.tapOverlay}
          onPress={onSeeFullMap}
          accessibilityRole="button"
          accessibilityLabel="Ver mapa completo"
          testID="home.quickmap.frame"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  mapFrame: {
    height: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundApp,
  },
  mapInner: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapOverlay: { ...StyleSheet.absoluteFillObject },
});
