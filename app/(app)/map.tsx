import { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { AlertMarker } from '../../src/components/map/AlertMarker';
import { PlaceMarker } from '../../src/components/map/PlaceMarker';
import { RoutePolyline } from '../../src/components/map/RoutePolyline';
import { StrayMarker } from '../../src/components/map/StrayMarker';
import { HuellitasMap } from '../../src/components/map/HuellitasMap';
import { MapFilters } from '../../src/components/map/MapFilters';
import { RadiusCircle } from '../../src/components/map/RadiusCircle';
import { RadiusDropdown } from '../../src/components/map/RadiusDropdown';
import { PlaceBottomSheet } from '../../src/components/places/PlaceBottomSheet';
import { RouteBottomSheet } from '../../src/components/routes/RouteBottomSheet';
import { Skeleton } from '../../src/components/skeleton/Skeleton';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import type {
  LostReport,
  LostReportSpeciesFilter,
  MapReportTypeFilter,
} from '../../src/domain/lostReports';
import type { Place } from '../../src/domain/places';
import type { Route } from '../../src/domain/routes';
import { colors, radius, spacing, typography } from '../../src/design/tokens';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useNearbyPlaces, useUpvotePlace } from '../../src/hooks/usePlaces';
import { useNearbyRoutes, useRateRoute } from '../../src/hooks/useRoutes';
import { useNearbyStrayReports } from '../../src/hooks/useStrayReports';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';

import BRAND_LOGO from '../../assets/icon.png';

type MapLayer = 'alerts' | 'lugares';

function showReportActionSheet(onLostPet: () => void, onStray: () => void): void {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancelar', 'Mascota perdida', 'Vi un animal suelto'],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) onLostPet();
        if (index === 2) onStray();
      },
    );
  } else {
    Alert.alert('Reportar', '¿Qué quieres reportar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Mascota perdida', onPress: onLostPet },
      { text: 'Vi un animal suelto', onPress: onStray },
    ]);
  }
}

export default function MapScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const setAlertRadius = useSettingsStore((s) => s.setAlertRadius);
  const [selectedSpecies, setSelectedSpecies] = useState<LostReportSpeciesFilter>('all');
  const [selectedReportType, setSelectedReportType] = useState<MapReportTypeFilter>('all');
  const [layer, setLayer] = useState<MapLayer>('alerts');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const searchCenter = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const strayQuery = useNearbyStrayReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const placesQuery = useNearbyPlaces({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
    enabled: layer === 'lugares',
  });

  const upvoteMutation = useUpvotePlace();

  const routesQuery = useNearbyRoutes({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
    enabled: layer === 'lugares',
  });

  const rateRouteMutation = useRateRoute();

  // Solo mostrar loading en la carga inicial — no al cambiar el radio (evita que el skeleton tape el mapa)
  const hasLoadedOnce = useRef(false);
  if (reportsQuery.data !== undefined) hasLoadedOnce.current = true;
  const showReportsLoading = reportsQuery.fetchStatus === 'fetching' && !hasLoadedOnce.current;

  const isSpeciesVisible = useCallback(
    (petSpecies: LostReport['petSpecies']): boolean => {
      if (selectedSpecies === 'all') return true;
      if (selectedSpecies === 'other') return petSpecies !== 'dog' && petSpecies !== 'cat';
      return petSpecies === selectedSpecies;
    },
    [selectedSpecies],
  );

  const openReport = useCallback(
    (reportId: string): void => {
      router.push(`/(app)/reports/${reportId}` as Href);
    },
    [router],
  );

  const openStray = useCallback(
    (strayId: string): void => {
      router.push(`/(app)/stray/${strayId}` as Href);
    },
    [router],
  );

  const openPlace = useCallback(
    (placeId: string): void => {
      setSelectedPlace(null);
      router.push(`/(app)/places/${placeId}` as Href);
    },
    [router],
  );

  const handlePlaceCallout = useCallback(
    (placeId: string): void => {
      const place = (placesQuery.data ?? []).find((p) => p.id === placeId);
      if (place) setSelectedPlace(place);
    },
    [placesQuery.data],
  );

  const handleRouteCallout = useCallback(
    (routeId: string): void => {
      const route = (routesQuery.data ?? []).find((r) => r.id === routeId);
      if (route) setSelectedRoute(route);
    },
    [routesQuery.data],
  );

  const openRoute = useCallback(
    (routeId: string): void => {
      setSelectedRoute(null);
      router.push(`/(app)/routes/${routeId}` as Href);
    },
    [router],
  );

  const handleFab = useCallback((): void => {
    if (layer === 'lugares') {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ['Cancelar', 'Agregar lugar', 'Agregar paseo'], cancelButtonIndex: 0 },
          (index) => {
            if (index === 1) router.push('/(app)/places/new' as Href);
            if (index === 2) router.push('/(app)/routes/new' as Href);
          },
        );
      } else {
        Alert.alert('Agregar', '¿Qué querés agregar?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Lugar', onPress: () => router.push('/(app)/places/new' as Href) },
          { text: 'Paseo', onPress: () => router.push('/(app)/routes/new' as Href) },
        ]);
      }
      return;
    }
    showReportActionSheet(
      () => router.push('/(app)/pets' as Href),
      () => router.push('/(app)/stray/new' as Href),
    );
  }, [layer, router]);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="Huellitas"
              resizeMode="contain"
              source={BRAND_LOGO}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.brandLabel}>Huellitas</Text>
        </View>
        <View style={styles.actions}>
          <Ionicons color={colors.textPrimary} name="search" size={20} />
          <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
        </View>
      </View>

      {/* Layer toggle */}
      <View style={styles.layerToggle}>
        <Pressable
          style={[styles.layerBtn, layer === 'alerts' && styles.layerBtnActive]}
          onPress={() => setLayer('alerts')}
          testID="map.layer.alerts"
        >
          <Text style={[styles.layerBtnLabel, layer === 'alerts' && styles.layerBtnLabelActive]}>
            Alertas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.layerBtn, layer === 'lugares' && styles.layerBtnActive]}
          onPress={() => setLayer('lugares')}
          testID="map.layer.lugares"
        >
          <Text style={[styles.layerBtnLabel, layer === 'lugares' && styles.layerBtnLabelActive]}>
            Lugares
          </Text>
        </Pressable>
      </View>

      {layer === 'alerts' ? (
        <MapFilters
          onChange={setSelectedSpecies}
          selected={selectedSpecies}
          selectedType={selectedReportType}
          onChangeType={setSelectedReportType}
        />
      ) : null}

      <View style={styles.mapCard}>
        <HuellitasMap containerStyle={styles.mapInner} showCenterButton={false}>
          {showReportsLoading && layer === 'alerts' ? (
            <Skeleton style={StyleSheet.absoluteFillObject} borderRadius={18} />
          ) : null}

          <View style={styles.mapChips}>
            <View style={styles.smallChip}>
              <Ionicons color={colors.textSecondary} name="location" size={12} />
              <Text style={styles.smallChipLabel}>Colima, Colima</Text>
            </View>
            <RadiusDropdown
              value={alertRadiusKm}
              onChange={setAlertRadius}
              variant="map"
              testID="map.radius.trigger"
            />
          </View>

          {layer === 'alerts' ? (
            <RadiusCircle center={searchCenter} radiusKm={alertRadiusKm} />
          ) : null}

          {(reportsQuery.data ?? []).map((report: LostReport) => {
            const typeVisible = selectedReportType === 'all' || selectedReportType === 'lost';
            const visible =
              layer === 'alerts' && typeVisible && isSpeciesVisible(report.petSpecies);
            return (
              <AlertMarker
                key={report.id}
                report={report}
                onPressCallout={openReport}
                opacity={visible ? 1 : 0}
                interactive={visible}
              />
            );
          })}
          {(strayQuery.data ?? []).map((stray) => {
            const typeVisible = selectedReportType === 'all' || selectedReportType === 'stray';
            const visible = layer === 'alerts' && typeVisible;
            return (
              <StrayMarker
                key={`stray-${stray.id}`}
                report={stray}
                onPressCallout={openStray}
                opacity={visible ? 1 : 0}
              />
            );
          })}
          {(placesQuery.data ?? []).map((place) => (
            <PlaceMarker
              key={`place-${place.id}`}
              place={place}
              onPressCallout={handlePlaceCallout}
              opacity={layer === 'lugares' ? 1 : 0}
            />
          ))}
          {(routesQuery.data ?? []).map((route: Route) => (
            <RoutePolyline
              key={`route-${route.id}`}
              route={route}
              onPressCallout={handleRouteCallout}
              opacity={layer === 'lugares' ? 1 : 0}
            />
          ))}

          {showReportsLoading && layer === 'alerts' ? (
            <View style={styles.overlay} testID="reports.loading">
              <Text style={styles.overlayLabel}>Cargando reportes cercanos...</Text>
            </View>
          ) : null}
        </HuellitasMap>
      </View>

      <Pressable
        onPress={handleFab}
        style={[styles.fab, layer === 'lugares' && styles.fabGreen]}
        testID="map.fab"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <PlaceBottomSheet
        place={selectedPlace}
        visible={selectedPlace != null}
        onClose={() => setSelectedPlace(null)}
        onViewDetail={openPlace}
        onUpvote={(placeId, currentlyUpvoted) => {
          upvoteMutation.mutate({ placeId, currentlyUpvoted });
          if (selectedPlace?.id === placeId) {
            setSelectedPlace({
              ...selectedPlace,
              hasUpvoted: !currentlyUpvoted,
              upvoteCount: currentlyUpvoted
                ? selectedPlace.upvoteCount - 1
                : selectedPlace.upvoteCount + 1,
            });
          }
        }}
        isUpvoting={upvoteMutation.isPending}
      />

      <RouteBottomSheet
        route={selectedRoute}
        visible={selectedRoute != null}
        onClose={() => setSelectedRoute(null)}
        onViewDetail={openRoute}
        onRate={(routeId, rating) => rateRouteMutation.mutate({ routeId, rating })}
        isRating={rateRouteMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  topBar: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  layerToggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  layerBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  layerBtnActive: { backgroundColor: colors.primary },
  layerBtnLabel: { ...typography.caption, color: colors.textSecondary },
  layerBtnLabelActive: { color: colors.white, fontWeight: '600' },
  mapCard: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  mapInner: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  mapChips: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 20,
  },
  smallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  smallChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  overlay: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
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
  legend: {
    marginTop: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundApp,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendItem: {
    ...typography.caption,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navActive,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabGreen: { backgroundColor: colors.success },
});
