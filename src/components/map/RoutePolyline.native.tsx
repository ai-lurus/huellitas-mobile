import { StyleSheet, Text, View } from 'react-native';
import { Callout, Marker, Polyline } from 'react-native-maps';

import type { Route } from '../../domain/routes';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../domain/routes';
import { colors, spacing, typography } from '../../design/tokens';

interface RoutePolylineProps {
  route: Route;
  onPressCallout: (routeId: string) => void;
}

export function RoutePolyline({ route, onPressCallout }: RoutePolylineProps): React.JSX.Element {
  const coordinates = route.waypoints.map((wp) => ({
    latitude: wp.lat,
    longitude: wp.lng,
  }));

  const color =
    route.difficulty != null ? (DIFFICULTY_COLORS[route.difficulty] ?? '#6B7280') : '#6B7280';

  const difficultyLabel =
    route.difficulty != null ? (DIFFICULTY_LABELS[route.difficulty] ?? '') : '';

  const startCoord = coordinates[0];

  return (
    <>
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={4}
        lineDashPattern={[0]}
        tappable
        testID={`route-polyline.${route.id}`}
      />
      {startCoord != null ? (
        <Marker
          coordinate={startCoord}
          identifier={`route-start-${route.id}`}
          testID={`route-marker.${route.id}`}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.startPin, { borderColor: color }]}>
            <Text style={styles.startIcon}>🐾</Text>
          </View>
          <Callout onPress={() => onPressCallout(route.id)} testID={`route-callout.${route.id}`}>
            <View style={styles.callout}>
              <Text style={styles.name}>{route.name}</Text>
              {difficultyLabel ? (
                <Text style={[styles.difficulty, { color }]}>{difficultyLabel}</Text>
              ) : null}
              {route.distanceKm != null ? (
                <Text style={styles.meta}>{route.distanceKm.toFixed(1)} km</Text>
              ) : null}
              {route.offLeashAllowed ? <Text style={styles.offLeash}>🐕 Sin correa</Text> : null}
              <Text style={styles.cta}>Toca para ver más</Text>
            </View>
          </Callout>
        </Marker>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  startPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIcon: { fontSize: 16 },
  callout: {
    minWidth: 150,
    gap: 2,
    padding: spacing.xs,
  },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  difficulty: { ...typography.caption, fontWeight: '600' },
  meta: { ...typography.caption, color: colors.textSecondary },
  offLeash: { ...typography.caption, color: colors.success },
  cta: { ...typography.caption, color: colors.primary, marginTop: 4 },
});
