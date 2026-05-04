import React, { useMemo } from 'react';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Platform, StyleSheet, View } from 'react-native';

import type { LostReportSighting } from '../../domain/lostReportDetail';
import { colors } from '../../design/tokens';

export interface LostReportMapProps {
  center: { lat: number; lng: number };
  radiusMeters?: number;
  sightings: LostReportSighting[];
  testID?: string;
  variant?: 'card' | 'fullscreen';
}

function toRegion(centerLat: number, centerLng: number, radiusMeters: number): Region {
  const r = radiusMeters > 0 ? radiusMeters : 2000;
  const latDelta = Math.max(0.01, Math.min(0.35, (r / 111000) * 2));
  const lonDelta = Math.max(
    0.01,
    Math.min(0.35, (r / (111000 * Math.cos((centerLat * Math.PI) / 180))) * 2),
  );
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

export function LostReportMap({
  center,
  radiusMeters,
  sightings,
  testID = 'lostReportMap',
  variant = 'card',
}: LostReportMapProps): React.JSX.Element {
  const initialRegion = useMemo<Region>(() => {
    return toRegion(center.lat, center.lng, radiusMeters ?? 2000);
  }, [center.lat, center.lng, radiusMeters]);

  return (
    <View
      style={[styles.root, variant === 'fullscreen' ? styles.rootFullscreen : null]}
      testID={testID}
    >
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      >
        <Circle
          center={{ latitude: center.lat, longitude: center.lng }}
          radius={radiusMeters ?? 2000}
          strokeColor="rgba(59, 130, 246, 0.8)"
          fillColor="rgba(59, 130, 246, 0.15)"
          strokeWidth={2}
        />
        <Marker
          coordinate={{ latitude: center.lat, longitude: center.lng }}
          pinColor={colors.danger}
          testID="lostReportMap.lossPin"
        />
        {sightings.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.location.lat, longitude: s.location.lng }}
            pinColor={colors.primary}
            testID={`lostReportMap.sightingPin.${s.id}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', height: 260 },
  rootFullscreen: { flex: 1, height: undefined },
  map: { flex: 1 },
});
