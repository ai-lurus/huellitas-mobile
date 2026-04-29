import { Image, StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

import type { LostReport } from '../../domain/lostReports';
import { colors, spacing, typography } from '../../design/tokens';

interface AlertMarkerProps {
  report: LostReport;
  onPressCallout: (reportId: string) => void;
}

function speciesEmoji(species: LostReport['petSpecies']): string {
  if (species === 'dog') return '🐶';
  if (species === 'cat') return '🐱';
  if (species === 'bird') return '🐦';
  if (species === 'rabbit') return '🐰';
  return '🐾';
}

function formatDistance(value: number): string {
  if (!Number.isFinite(value)) return '--';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'ahora';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function AlertMarker({ report, onPressCallout }: AlertMarkerProps): React.JSX.Element {
  return (
    <Marker
      coordinate={{ latitude: report.lat, longitude: report.lng }}
      identifier={report.id}
      testID={`marker.${report.id}`}
    >
      <View style={styles.pin}>
        {report.petPhotoUrl ? (
          <Image source={{ uri: report.petPhotoUrl }} style={styles.photo} />
        ) : (
          <Text style={styles.emoji}>{speciesEmoji(report.petSpecies)}</Text>
        )}
      </View>
      <Callout
        onPress={(): void => onPressCallout(report.id)}
        testID={`marker.callout.${report.id}`}
      >
        <View style={styles.callout}>
          <Text style={styles.name}>{report.petName}</Text>
          <Text style={styles.meta}>{report.petBreed ?? 'Raza no especificada'}</Text>
          <Text style={styles.meta}>A {formatDistance(report.distanceMeters)} de ti</Text>
          <Text style={styles.meta}>{formatTimeAgo(report.createdAt)}</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  emoji: {
    fontSize: 20,
  },
  callout: {
    minWidth: 160,
    gap: 2,
    padding: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
