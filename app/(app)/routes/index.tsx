import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { RouteCard } from '../../../src/components/routes/RouteCard';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { useNearbyRoutes } from '../../../src/hooks/useRoutes';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

export default function RouteListScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const center = currentLocation ?? DEFAULT_MAP_FALLBACK;

  const {
    data: routes,
    isLoading,
    isError,
    refetch,
  } = useNearbyRoutes({
    lat: center.lat,
    lng: center.lng,
    radius: Math.max(alertRadiusKm, 10),
  });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="routes.back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Rutas para pasear</Text>
        <Pressable onPress={() => router.push('/(app)/routes/new' as Href)} testID="routes.add">
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudieron cargar las rutas.</Text>
          <Pressable onPress={() => void refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnLabel}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (routes ?? []).length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin rutas cercanas</Text>
          <Text style={styles.emptyBody}>¡Sé el primero en compartir tu ruta favorita!</Text>
          <Pressable onPress={() => router.push('/(app)/routes/new' as Href)} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnLabel}>Agregar ruta</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <RouteCard
              route={item}
              onPress={() => router.push(`/(app)/routes/${item.id}` as Href)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.heading, color: colors.textPrimary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryBtnLabel: { ...typography.button, color: colors.white },
  emptyTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  ctaBtnLabel: { ...typography.button, color: colors.white },
  list: { padding: spacing.md, paddingBottom: spacing.xxxl },
});
