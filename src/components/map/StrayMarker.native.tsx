import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

import type { StrayReport } from '../../domain/strayReports';
import { colors, spacing, typography } from '../../design/tokens';

interface StrayMarkerProps {
  report: StrayReport;
  onPressCallout: (strayId: string) => void;
  opacity?: number;
}

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Animal',
};

export const StrayMarker = memo(function StrayMarker({
  report,
  onPressCallout,
  opacity = 1,
}: StrayMarkerProps): React.JSX.Element {
  const label = SPECIES_LABELS[report.species] ?? 'Animal';

  return (
    <Marker
      coordinate={{ latitude: report.lat, longitude: report.lng }}
      identifier={`stray-${report.id}`}
      testID={`stray-marker.${report.id}`}
      opacity={opacity}
      tracksViewChanges={false}
    >
      <View style={styles.pin}>
        <Text style={styles.icon}>?</Text>
      </View>
      <Callout onPress={() => onPressCallout(report.id)} testID={`stray-callout.${report.id}`}>
        <View style={styles.callout}>
          <Text style={styles.name}>{label} suelto</Text>
          {report.color ? <Text style={styles.meta}>Color: {report.color}</Text> : null}
          {report.description ? (
            <Text style={styles.meta} numberOfLines={2}>
              {report.description}
            </Text>
          ) : null}
          <Text style={styles.cta}>Toca para ver más</Text>
        </View>
      </Callout>
    </Marker>
  );
});

const styles = StyleSheet.create({
  pin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  callout: {
    minWidth: 150,
    gap: 2,
    padding: spacing.xs,
  },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary },
  cta: { ...typography.caption, color: colors.primary, marginTop: 4 },
});
