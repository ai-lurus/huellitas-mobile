import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import type { LostReport } from '../../domain/lostReports';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

export interface ReportCardProps {
  report: LostReport;
  onPress: () => void;
}

function speciesLabel(species: LostReport['petSpecies']): string {
  if (species === 'dog') return 'Perro';
  if (species === 'cat') return 'Gato';
  if (species === 'bird') return 'Perico';
  if (species === 'rabbit') return 'Conejo';
  return 'Otro';
}

function formatDistance(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) return '--';
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatTimeAgo(isoDate: string): string {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) return 'ahora';
  const diff = Math.max(0, Date.now() - createdAt.getTime());
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

export function ReportCard({ report, onPress }: ReportCardProps): React.ReactElement {
  const isLost = report.reportKind === 'lost';
  const stripColor = isLost ? '#E11D48' : '#3B82F6';
  const badgeBg = isLost ? '#FF6B3D' : '#3B82F6';
  const badgeLabel = isLost ? 'PERDIDO' : 'VISTO';

  const metaLine = [speciesLabel(report.petSpecies), report.petBreed].filter(Boolean).join(' • ');

  return (
    <Pressable
      accessibilityLabel={`${report.petName}, ${speciesLabel(report.petSpecies)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      testID={`report-card.${report.id}`}
    >
      <View style={styles.cardInner}>
        <View style={[styles.statusStrip, { backgroundColor: stripColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.thumbWrap}>
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeLabel}>{badgeLabel}</Text>
              </View>
              {report.petPhotoUrl ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: report.petPhotoUrl }}
                  style={styles.thumb}
                />
              ) : report.petSpecies === 'bird' ? (
                <View style={styles.fallbackThumbBird}>
                  <MaterialCommunityIcons color="#22C55E" name="bird" size={28} />
                </View>
              ) : (
                <View style={styles.fallbackThumb}>
                  <Text style={styles.fallbackEmoji}>🐾</Text>
                </View>
              )}
            </View>
            <View style={styles.content}>
              <Text numberOfLines={1} style={styles.name}>
                {report.petName}
              </Text>
              <Text numberOfLines={1} style={styles.meta}>
                {metaLine}
              </Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailGroup}>
                  <Ionicons color={colors.textSecondary} name="location-outline" size={12} />
                  <Text style={styles.details}>{formatDistance(report.distanceMeters)}</Text>
                </View>
                <View style={styles.detailGroup}>
                  <Ionicons color={colors.textSecondary} name="time-outline" size={12} />
                  <Text style={styles.details}>{formatTimeAgo(report.createdAt)}</Text>
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
  fallbackThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackThumbBird: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  fallbackEmoji: { fontSize: 22 },
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
