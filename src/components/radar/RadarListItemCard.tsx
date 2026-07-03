import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RadarListItem } from '../../domain/radarListItem';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { formatRelativeTime } from '../../utils/date.utils';
import { SPECIES_ICON_ASSETS, SPECIES_LABELS } from '../pets/speciesIconAssets';
import { PetPhoto } from '../common/PetPhoto';

export interface RadarListItemCardProps {
  item: RadarListItem;
  onPress: () => void;
}

const BADGE_BY_KIND: Record<RadarListItem['kind'], { label: string; color: string }> = {
  lost: { label: 'PERDIDO', color: colors.danger },
  sighted: { label: 'VISTO', color: colors.primary },
  found: { label: 'ENCONTRADO', color: colors.accent },
};

function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) return '--';
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function RadarListItemCard({ item, onPress }: RadarListItemCardProps): React.ReactElement {
  const badge = BADGE_BY_KIND[item.kind];
  const metaLine = [SPECIES_LABELS[item.species], item.breed].filter(Boolean).join(' • ');

  return (
    <Pressable
      accessibilityLabel={`${item.name}, ${SPECIES_LABELS[item.species]}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      testID={`radar.listItem.${item.id}`}
    >
      <View style={styles.cardInner}>
        <View style={[styles.statusStrip, { backgroundColor: badge.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.thumbWrap}>
              <View style={[styles.badge, { backgroundColor: badge.color }]}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeLabel}>{badge.label}</Text>
              </View>
              <PetPhoto
                uri={item.photoUrl}
                fallback={SPECIES_ICON_ASSETS[item.species].selected}
                style={styles.thumb}
                resizeMode="cover"
              />
            </View>
            <View style={styles.content}>
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={styles.meta}>
                {metaLine}
              </Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailGroup}>
                  <Ionicons color={colors.textSecondary} name="location-outline" size={12} />
                  <Text style={styles.details}>{formatDistance(item.distanceMeters)}</Text>
                </View>
                <View style={styles.detailGroup}>
                  <Ionicons color={colors.textSecondary} name="time-outline" size={12} />
                  <Text style={styles.details}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  pressed: { opacity: 0.92 },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statusStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    minWidth: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ECEFF5',
  },
  thumb: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    zIndex: 2,
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
  },
  badgeLabel: {
    ...typography.caption,
    fontSize: 9,
    letterSpacing: 0.3,
    color: colors.white,
    fontWeight: '700',
  },
  content: { flex: 1, minWidth: 0 },
  name: { color: colors.textPrimary, ...typography.bodyStrong, fontSize: 17 },
  meta: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
  detailsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  detailGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  details: { color: colors.textSecondary, ...typography.caption },
});
