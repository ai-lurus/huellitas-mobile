import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors, radius, spacing, typography } from '../../design/tokens';
import { useLocationStore } from '../../stores/locationStore';
import { CenterButton } from './CenterButton';

interface HuellitasMapProps {
  children?: React.ReactNode;
  showCenterButton?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  mapRefOverride?: React.MutableRefObject<{
    animateToRegion: (region: Region, duration?: number) => void;
  } | null>;
}

const DEFAULT_DELTA = 0.05;
const MAP_READY_TIMEOUT_MS = 8000;

function toRegion(lat: number, lng: number): Region {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };
}

export function HuellitasMap({
  children,
  mapRefOverride,
  showCenterButton = true,
  containerStyle,
}: HuellitasMapProps): React.JSX.Element {
  const mapRef = useRef<MapView>(null);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const hasCenteredInitially = useRef(false);

  const initialRegion = useMemo<Region | undefined>(() => {
    if (!currentLocation) return undefined;
    return toRegion(currentLocation.lat, currentLocation.lng);
  }, [currentLocation]);

  useEffect(() => {
    if (mapReady || mapError) return;
    const timeout = setTimeout(() => {
      setMapError('No se pudo inicializar el mapa. Intenta nuevamente.');
    }, MAP_READY_TIMEOUT_MS);
    return (): void => clearTimeout(timeout);
  }, [mapReady, mapError]);

  useEffect(() => {
    if (!mapReady || !currentLocation || hasCenteredInitially.current) return;
    const mapCommands = mapRefOverride?.current ?? mapRef.current;
    mapCommands?.animateToRegion(toRegion(currentLocation.lat, currentLocation.lng), 500);
    hasCenteredInitially.current = true;
  }, [currentLocation, mapReady, mapRefOverride]);

  const centerOnUser = (): void => {
    if (!currentLocation) return;
    const mapCommands = mapRefOverride?.current ?? mapRef.current;
    mapCommands?.animateToRegion(toRegion(currentLocation.lat, currentLocation.lng), 500);
  };

  const retryMap = (): void => {
    setMapError(null);
    setMapReady(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView
        initialRegion={initialRegion}
        onMapReady={(): void => {
          setMapReady(true);
          setMapError(null);
        }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        style={styles.map}
        testID="huellitas-map"
      >
        {children}
      </MapView>

      {!mapReady && !mapError ? (
        <View style={styles.loadingOverlay} testID="map.loading">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      ) : null}

      {mapError ? (
        <View style={styles.errorOverlay} testID="map.error">
          <Text style={styles.errorTitle}>Mapa no disponible</Text>
          <Text style={styles.errorText}>{mapError}</Text>
          <Pressable onPress={retryMap} style={styles.retryButton} testID="map.error.retry">
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {showCenterButton ? <CenterButton onPress={centerOnUser} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(249, 248, 246, 0.9)',
  },
  loadingText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  errorOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: spacing.xs,
  },
  errorTitle: {
    ...typography.bodyStrong,
    color: colors.dangerDark,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  retryButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
