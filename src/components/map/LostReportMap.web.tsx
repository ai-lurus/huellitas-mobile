import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LostReportSighting } from '../../domain/lostReportDetail';
import { colors, radius, spacing, typography } from '../../design/tokens';

export interface LostReportMapProps {
  center: { lat: number; lng: number };
  radiusMeters?: number;
  sightings: LostReportSighting[];
  testID?: string;
  variant?: 'card' | 'fullscreen';
}

export function LostReportMap({
  center,
  radiusMeters,
  sightings,
  testID = 'lostReportMap',
  variant = 'card',
}: LostReportMapProps): React.JSX.Element {
  const radiusLabel =
    radiusMeters && Number.isFinite(radiusMeters) ? `${Math.round(radiusMeters / 1000)} km` : '—';

  return (
    <View
      style={[styles.root, variant === 'fullscreen' ? styles.rootFullscreen : null]}
      testID={testID}
    >
      <View style={styles.fallbackCard}>
        <Text style={styles.title}>Mapa no disponible en web</Text>
        <Text style={styles.text}>
          Centro: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </Text>
        <Text style={styles.text}>Radio: {radiusLabel}</Text>
        <Text style={styles.text}>{sightings.length} avistamientos en el mapa</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 260 },
  rootFullscreen: { flex: 1, height: undefined },
  fallbackCard: {
    margin: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  text: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
});
