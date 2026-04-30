import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useLostReportDetail } from '../../../../src/hooks/useLostReports';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';

function fmtHoursFromMinutes(totalMinutes: number | null | undefined): string | null {
  if (totalMinutes == null || !Number.isFinite(totalMinutes)) return null;
  const h = Math.max(0, Math.round(totalMinutes / 60));
  return `${h}h`;
}

function diffMinutes(
  aIso: string | null | undefined,
  bIso: string | null | undefined,
): number | null {
  if (!aIso || !bIso) return null;
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

export default function ReportFoundSuccessScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, resolvedAt, notified, sightings, totalMinutes } = useLocalSearchParams<{
    id: string;
    resolvedAt?: string;
    notified?: string;
    sightings?: string;
    totalMinutes?: string;
  }>();

  const reportId = id ?? '';
  const detailQuery = useLostReportDetail(reportId);
  const detail = detailQuery.data;

  const petName = detail?.petName ?? 'tu mascota';
  const photoUrl = detail?.petPhotoUrl ?? undefined;

  const notifiedCount = useMemo(() => {
    const n = notified != null ? Number(notified) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [notified]);

  const sightingsCount = useMemo(() => {
    const s = sightings != null ? Number(sightings) : NaN;
    if (Number.isFinite(s)) return s;
    return detail?.sightings?.length ?? null;
  }, [detail?.sightings?.length, sightings]);

  const totalH = useMemo(() => {
    const m = totalMinutes != null ? Number(totalMinutes) : NaN;
    const explicit = Number.isFinite(m) ? fmtHoursFromMinutes(m) : null;
    if (explicit) return explicit;
    const derived = diffMinutes(detail?.createdAt ?? null, resolvedAt ?? null);
    return fmtHoursFromMinutes(derived);
  }, [detail?.createdAt, resolvedAt, totalMinutes]);

  const shareMessage = useMemo(
    () => `¡${petName} está en casa! Gracias a la comunidad Huellitas.`,
    [petName],
  );

  useEffect(() => {
    // Si el detalle aún no está, esperamos; no bloqueamos el render.
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.root} testID="report.found.success">
        <ConfettiCannon count={200} origin={{ x: 0, y: 0 }} fadeOut />

        <View style={styles.heroWrap}>
          <View style={styles.photoRing}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photo} />
            )}
          </View>
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </View>
        </View>

        <Text style={styles.title}>¡{petName} está en casa!</Text>
        <Text style={styles.subtitle}>Gracias a la comunidad Huellitas</Text>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumOrange}>{notifiedCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Personas ayudaron</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNumBlue}>{sightingsCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Avistamientos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNumGreen}>{totalH ?? '—'}</Text>
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.shareBtn}
          testID="report.found.success.share"
          onPress={async () => {
            try {
              await Share.share({ message: shareMessage, title: 'Huellitas' });
            } catch {
              // no-op
            }
          }}
        >
          <Ionicons name="share-social-outline" size={18} color={colors.white} />
          <Text style={styles.shareBtnText}>Compartir la buena noticia</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          testID="report.found.success.done"
          onPress={() => router.replace('/(app)')}
        >
          <Text style={styles.doneText}>Listo</Text>
        </Pressable>

        <Text style={styles.footer}>Felicitaciones!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF7F4' },
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },

  heroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  photoRing: {
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  photo: { width: 118, height: 118, borderRadius: 59, backgroundColor: '#ECEFF5' },
  checkBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF7F4',
    ...shadows.button,
  },

  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

  statsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
    marginTop: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, opacity: 0.7 },
  statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  statNumOrange: { fontSize: 24, fontWeight: '900', color: colors.navActive },
  statNumBlue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  statNumGreen: { fontSize: 24, fontWeight: '900', color: colors.success },

  shareBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.button,
    marginTop: spacing.md,
  },
  shareBtnText: { ...typography.button, color: colors.white },
  doneText: { ...typography.bodyStrong, color: colors.textSecondary, marginTop: spacing.sm },
  footer: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg },
});
