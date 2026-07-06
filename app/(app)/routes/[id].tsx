import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { HuellitasMap } from '../../../src/components/map/HuellitasMap';
import { RoutePolyline } from '../../../src/components/map/RoutePolyline';
import type { RouteDifficulty } from '../../../src/domain/routes';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../../src/domain/routes';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { useRouteDetail, useRateRoute } from '../../../src/hooks/useRoutes';

function Stars({
  value,
  onSelect,
}: {
  value: number;
  onSelect?: (n: number) => void;
}): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onSelect?.(n)} hitSlop={8}>
          <Ionicons
            name={n <= Math.round(value) ? 'star' : 'star-outline'}
            size={onSelect ? 28 : 16}
            color="#F59E0B"
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function RouteDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: route, isLoading, isError } = useRouteDetail(id ?? '');
  const rateMutation = useRateRoute();

  const openInMaps = (): void => {
    if (!route || route.waypoints.length === 0) return;
    const start = route.waypoints[0];
    const end = route.waypoints[route.waypoints.length - 1];
    if (!start || !end) return;
    const url = `https://maps.google.com/maps?saddr=${start.lat},${start.lng}&daddr=${end.lat},${end.lng}`;
    void Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || route == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>No se pudo cargar la ruta</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const diffColor =
    route.difficulty != null ? DIFFICULTY_COLORS[route.difficulty as RouteDifficulty] : '#6B7280';
  const diffLabel =
    route.difficulty != null ? DIFFICULTY_LABELS[route.difficulty as RouteDifficulty] : null;

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={route.name} onBack={() => router.back()} testID="route-detail" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.mapBox}>
          <HuellitasMap containerStyle={styles.mapInner} showCenterButton={false}>
            <RoutePolyline route={route} onPressCallout={() => {}} />
          </HuellitasMap>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{route.name}</Text>
            {diffLabel != null ? (
              <View style={[styles.diffBadge, { borderColor: diffColor }]}>
                <Text style={[styles.diffLabel, { color: diffColor }]}>{diffLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.stats}>
            {route.distanceKm != null ? (
              <StatChip icon="navigate-outline" label={`${route.distanceKm.toFixed(1)} km`} />
            ) : null}
            {route.estimatedMinutes != null ? (
              <StatChip icon="time-outline" label={`${route.estimatedMinutes} min`} />
            ) : null}
            {route.offLeashAllowed ? (
              <StatChip icon="paw-outline" label="Sin correa" color={colors.success} />
            ) : null}
          </View>

          {route.description != null ? (
            <Text style={styles.description}>{route.description}</Text>
          ) : null}
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <Stars value={route.ratingAvg} />
            <Text style={styles.ratingText}>
              {route.ratingAvg > 0 ? route.ratingAvg.toFixed(1) : '—'} · {route.ratingCount}{' '}
              valoraciones
            </Text>
          </View>
          <Text style={styles.rateLabel}>Califica esta ruta:</Text>
          {rateMutation.isPending ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 4 }} />
          ) : (
            <Stars
              value={route.userRating ?? 0}
              onSelect={(n) => rateMutation.mutate({ routeId: route.id, rating: n })}
            />
          )}
        </View>

        <Pressable onPress={openInMaps} style={styles.startBtn} testID="route-detail.start">
          <Ionicons name="navigate" size={18} color={colors.white} />
          <Text style={styles.startBtnLabel}>Iniciar paseo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatChip({
  icon,
  label,
  color = colors.textSecondary,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
}): React.JSX.Element {
  return (
    <View style={chipStyles.chip}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[chipStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundApp,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  label: { ...typography.caption },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { paddingBottom: spacing.xxxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backBtnLabel: { ...typography.button, color: colors.white },
  mapBox: {
    marginHorizontal: spacing.md,
    height: 240,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapInner: { flex: 1 },
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { ...typography.heading, color: colors.textPrimary, flex: 1 },
  diffBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffLabel: { ...typography.caption, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  ratingCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingText: { ...typography.caption, color: colors.textSecondary },
  rateLabel: { ...typography.label, color: colors.textSecondary },
  startBtn: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.success,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 46,
  },
  startBtnLabel: { ...typography.button, color: colors.white },
});
