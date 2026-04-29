import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { useLocationStore } from '../../stores/locationStore';

const DEFAULT_LAT = 19.4326;
const DEFAULT_LNG = -99.1332;
const DEFAULT_DELTA = 0.012;

export interface LocationPickerProps {
  onSelect: (lat: number, lng: number) => void;
  /** Si existe, el mapa inicia centrado aquí. */
  initialCenter?: { lat: number; lng: number } | null;
  testID?: string;
}

function toRegion(lat: number, lng: number, delta = DEFAULT_DELTA): Region {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function LocationPicker({
  onSelect,
  initialCenter,
  testID = 'locationPicker',
}: LocationPickerProps): React.JSX.Element {
  const mapRef = useRef<MapView>(null);
  const storeLoc = useLocationStore((s) => s.currentLocation);
  const lastRegionRef = useRef<Region | null>(null);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const initialRegion = useMemo(() => {
    const lat = initialCenter?.lat ?? storeLoc?.lat ?? DEFAULT_LAT;
    const lng = initialCenter?.lng ?? storeLoc?.lng ?? DEFAULT_LNG;
    const r = toRegion(lat, lng);
    lastRegionRef.current = r;
    return r;
  }, [initialCenter?.lat, initialCenter?.lng, storeLoc?.lat, storeLoc?.lng]);

  const onRegionChangeComplete = useCallback((r: Region): void => {
    lastRegionRef.current = r;
  }, []);

  const applySelection = useCallback(
    (lat: number, lng: number): void => {
      setSelected({ lat, lng });
      onSelect(lat, lng);
    },
    [onSelect],
  );

  const onMapPress = useCallback(
    (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }): void => {
      const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
      applySelection(lat, lng);
    },
    [applySelection],
  );

  const zoom = useCallback(
    (factor: number): void => {
      const r = lastRegionRef.current ?? initialRegion;
      const next: Region = {
        ...r,
        latitudeDelta: Math.max(0.0005, r.latitudeDelta * factor),
        longitudeDelta: Math.max(0.0005, r.longitudeDelta * factor),
      };
      lastRegionRef.current = next;
      mapRef.current?.animateToRegion(next, 200);
    },
    [initialRegion],
  );

  const handleUseMyLocation = useCallback(async (): Promise<void> => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Activa el permiso de ubicación para usar tu posición actual.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const next = toRegion(lat, lng);
      lastRegionRef.current = next;
      mapRef.current?.animateToRegion(next, 400);
      applySelection(lat, lng);
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
    } finally {
      setLocating(false);
    }
  }, [applySelection]);

  return (
    <View style={styles.root} testID={testID}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegion}
        onMapReady={(): void => {
          if (lastRegionRef.current == null) lastRegionRef.current = initialRegion;
        }}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChangeComplete}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        style={styles.map}
        testID={`${testID}.map`}
      >
        {selected ? (
          <Marker
            coordinate={{ latitude: selected.lat, longitude: selected.lng }}
            pinColor={colors.navActive}
            testID={`${testID}.marker`}
          />
        ) : null}
      </MapView>

      <View pointerEvents="box-none" style={styles.zoomCol}>
        <Pressable
          accessibilityLabel="Acercar mapa"
          onPress={(): void => zoom(0.5)}
          style={styles.zoomBtn}
          testID={`${testID}.zoomIn`}
        >
          <Text style={styles.zoomTxt}>+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Alejar mapa"
          onPress={(): void => zoom(2)}
          style={[styles.zoomBtn, styles.zoomBtnLast]}
          testID={`${testID}.zoomOut`}
        >
          <Text style={styles.zoomTxt}>−</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Usar mi ubicación"
        disabled={locating}
        onPress={(): void => {
          void handleUseMyLocation();
        }}
        style={styles.useLocBtn}
        testID={`${testID}.useMyLocation`}
      >
        {locating ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            <Ionicons color={colors.textPrimary} name="navigate" size={18} />
            <Text style={styles.useLocText}>Usar mi ubicación</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  zoomCol: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  zoomBtnLast: { borderBottomWidth: 0 },
  zoomTxt: { fontSize: 22, color: colors.textPrimary, fontWeight: '600' },
  useLocBtn: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    maxWidth: '72%',
    ...shadows.md,
  },
  useLocText: { ...typography.bodyStrong, color: colors.textPrimary, flexShrink: 1 },
});
