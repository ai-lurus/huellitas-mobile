import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Route } from '../../domain/routes';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../domain/routes';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface RouteCardProps {
  route: Route;
  onPress: () => void;
}

function Stars({ value }: { value: number }): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= Math.round(value) ? 'star' : 'star-outline'}
          size={12}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export function RouteCard({ route, onPress }: RouteCardProps): React.JSX.Element {
  const diffColor = route.difficulty != null ? DIFFICULTY_COLORS[route.difficulty] : '#6B7280';
  const diffLabel = route.difficulty != null ? DIFFICULTY_LABELS[route.difficulty] : null;

  return (
    <Pressable onPress={onPress} style={styles.card} testID={`route-card.${route.id}`}>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {route.name}
          </Text>
          {diffLabel != null ? (
            <View
              style={[
                styles.diffBadge,
                { borderColor: diffColor, backgroundColor: `${diffColor}18` },
              ]}
            >
              <Text style={[styles.diffLabel, { color: diffColor }]}>{diffLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.stats}>
          {route.distanceKm != null ? (
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statText}>{route.distanceKm.toFixed(1)} km</Text>
            </View>
          ) : null}
          {route.estimatedMinutes != null ? (
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statText}>{route.estimatedMinutes} min</Text>
            </View>
          ) : null}
          {route.offLeashAllowed ? (
            <View style={styles.stat}>
              <Text style={styles.statText}>🐕 Sin correa</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rating}>
          <Stars value={route.ratingAvg} />
          <Text style={styles.ratingText}>
            {route.ratingAvg > 0 ? route.ratingAvg.toFixed(1) : '—'} ({route.ratingCount})
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  body: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  diffBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffLabel: { ...typography.caption, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...typography.caption, color: colors.textSecondary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingText: { ...typography.caption, color: colors.textSecondary },
});
