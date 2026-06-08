import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { LostReport } from '../../domain/lostReports';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

function speciesLabel(species: LostReport['petSpecies']): string {
  if (species === 'dog') return 'Perro';
  if (species === 'cat') return 'Gato';
  if (species === 'bird') return 'Ave';
  if (species === 'rabbit') return 'Conejo';
  return 'Otro';
}

function kindChip(kind: LostReport['reportKind']): { label: string; bg: string } {
  if (kind === 'resolved') return { label: 'RESUELTO', bg: colors.success };
  if (kind === 'sighted') return { label: 'VISTO', bg: '#3B82F6' };
  return { label: 'PERDIDO', bg: colors.navActive };
}

function formatDistanceKm(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters)) return '--';
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatTimeAgoEs(isoDate: string): string {
  const createdAt = new Date(isoDate);
  if (Number.isNaN(createdAt.getTime())) return 'Hace un momento';
  const diff = Math.max(0, Date.now() - createdAt.getTime());
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.round(hours / 24);
  return `Hace ${days} días`;
}

export function HomeReportCard({
  report,
  onPress,
}: {
  report: LostReport;
  onPress: () => void;
}): React.JSX.Element {
  const chip = kindChip(report.reportKind);
  const isResolved = report.reportKind === 'resolved';

  const description = useMemo(() => {
    const d = report.description?.trim();
    if (d && d.length > 0) return d;
    if (report.reportKind === 'sighted') return 'Alguien reportó un avistamiento reciente.';
    if (report.reportKind === 'resolved') return 'Este reporte ya fue resuelto.';
    return 'Ayúdanos a encontrarle.';
  }, [report.description, report.reportKind]);

  const speciesTone = useMemo(() => {
    if (report.petSpecies === 'bird')
      return {
        bg: 'rgba(67, 160, 71, 0.12)',
        border: 'rgba(67, 160, 71, 0.25)',
        text: colors.success,
        icon: 'leaf-outline' as const,
      };
    if (report.petSpecies === 'rabbit')
      return {
        bg: 'rgba(94, 114, 228, 0.12)',
        border: 'rgba(94, 114, 228, 0.25)',
        text: colors.primary,
        icon: 'paw-outline' as const,
      };
    if (report.petSpecies === 'cat')
      return {
        bg: 'rgba(255, 107, 53, 0.12)',
        border: 'rgba(255, 107, 53, 0.25)',
        text: colors.navActive,
        icon: 'paw-outline' as const,
      };
    if (report.petSpecies === 'dog')
      return {
        bg: 'rgba(255, 107, 53, 0.12)',
        border: 'rgba(255, 107, 53, 0.25)',
        text: colors.navActive,
        icon: 'paw-outline' as const,
      };
    return {
      bg: 'rgba(94, 114, 228, 0.12)',
      border: 'rgba(94, 114, 228, 0.25)',
      text: colors.primary,
      icon: 'paw-outline' as const,
    };
  }, [report.petSpecies]);

  const location = useMemo(() => {
    const l = report.locationLabel?.trim();
    return l && l.length > 0 ? l : '—';
  }, [report.locationLabel]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      testID={`home.reportCard.${report.id}`}
    >
      <View style={styles.imageWrap}>
        {report.petPhotoUrl ? (
          <Image source={{ uri: report.petPhotoUrl }} resizeMode="cover" style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name={report.petSpecies === 'bird' ? 'leaf' : 'paw'}
              size={48}
              color="rgba(0,0,0,0.12)"
            />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topMetaRow}>
          {isResolved ? (
            <>
              <Text style={styles.timeAgo}>{formatTimeAgoEs(report.createdAt)}</Text>
              <View style={[styles.kindPillSolid, { backgroundColor: chip.bg }]}>
                <View style={styles.kindDotSolid} />
                <Text style={styles.kindTextSolid}>{chip.label}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.kindPillSolid, { backgroundColor: chip.bg }]}>
                <View style={styles.kindDotSolid} />
                <Text style={styles.kindTextSolid}>{chip.label}</Text>
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgoEs(report.createdAt)}</Text>
            </>
          )}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {report.petName}
          </Text>
          <View
            style={[
              styles.speciesChip,
              { backgroundColor: speciesTone.bg, borderColor: speciesTone.border },
            ]}
          >
            <Ionicons name={speciesTone.icon} size={14} color={speciesTone.text} />
            <Text style={[styles.speciesChipText, { color: speciesTone.text }]}>
              {speciesLabel(report.petSpecies)}
            </Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.locText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <Text style={styles.distance}>{formatDistanceKm(report.distanceMeters)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },

  imageWrap: {
    width: '100%',
    height: 170,
    backgroundColor: '#ECEFF5',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#ECEFF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: spacing.md, gap: spacing.xs },

  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kindPillSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  kindDotSolid: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  kindTextSolid: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.white,
  },
  timeAgo: { ...typography.caption, color: colors.textMuted },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.textPrimary, flex: 1 },
  speciesChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speciesChipText: { ...typography.caption, fontWeight: '700' },

  desc: { ...typography.body, color: colors.textSecondary, lineHeight: 18 },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  locText: { ...typography.caption, color: colors.textMuted, flex: 1, minWidth: 0 },
  distance: { ...typography.bodyStrong, color: colors.navActive },
});
