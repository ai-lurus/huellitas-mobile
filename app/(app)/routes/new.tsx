import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { RouteForm } from '../../../src/components/routes/RouteForm';
import type { Waypoint } from '../../../src/domain/routes';
import { DIFFICULTY_COLORS } from '../../../src/domain/routes';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { useCreateRoute } from '../../../src/hooks/useRoutes';
import { useLocationStore } from '../../../src/stores/locationStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

type Step = 'map' | 'details';

export default function NewRouteScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const center = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const createMutation = useCreateRoute();

  const [step, setStep] = useState<Step>('map');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const mapRef = useRef<MapView>(null);

  const handleMapPress = (e: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }): void => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setWaypoints((prev) => [...prev, { lat: latitude, lng: longitude }]);
  };

  const undoLast = (): void => {
    setWaypoints((prev) => prev.slice(0, -1));
  };

  const polylineCoords = waypoints.map((wp) => ({ latitude: wp.lat, longitude: wp.lng }));

  if (step === 'details') {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          title="Detalles de la ruta"
          onBack={() => setStep('map')}
          testID="new-route"
        />
        <RouteForm
          waypoints={waypoints}
          isSubmitting={createMutation.isPending}
          onSubmit={(values) => {
            createMutation.mutate(values, {
              onSuccess: (route) => {
                router.replace(`/(app)/routes/${route.id}` as Href);
              },
            });
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Traza la ruta" onBack={() => router.back()} testID="new-route" />

      <Text style={styles.hint}>Toca el mapa para agregar puntos de la ruta</Text>

      <View style={styles.mapBox}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={handleMapPress}
          testID="new-route.map"
        >
          {waypoints.map((wp, idx) => (
            <Marker
              key={idx}
              coordinate={{ latitude: wp.lat, longitude: wp.lng }}
              pinColor={
                idx === 0
                  ? DIFFICULTY_COLORS.easy
                  : idx === waypoints.length - 1
                    ? DIFFICULTY_COLORS.hard
                    : colors.primary
              }
            />
          ))}
          {polylineCoords.length >= 2 ? (
            <Polyline coordinates={polylineCoords} strokeColor={colors.primary} strokeWidth={3} />
          ) : null}
        </MapView>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={undoLast}
          disabled={waypoints.length === 0}
          style={[styles.undoBtn, waypoints.length === 0 && styles.btnDisabled]}
          testID="new-route.undo"
        >
          <Ionicons name="arrow-undo" size={18} color={colors.textSecondary} />
          <Text style={styles.undoBtnLabel}>Deshacer</Text>
        </Pressable>

        <Text style={styles.waypointCount}>
          {waypoints.length} {waypoints.length === 1 ? 'punto' : 'puntos'}
        </Text>

        <Pressable
          onPress={() => setStep('details')}
          disabled={waypoints.length < 2}
          style={[styles.nextBtn, waypoints.length < 2 && styles.btnDisabled]}
          testID="new-route.next"
        >
          <Text style={styles.nextBtnLabel}>Continuar</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingBottom: spacing.xs,
  },
  mapBox: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  undoBtnLabel: { ...typography.caption, color: colors.textSecondary },
  waypointCount: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  nextBtnLabel: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
