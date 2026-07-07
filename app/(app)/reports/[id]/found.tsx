import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
import {
  useLostReportDetail,
  useResolveLostReportMutation,
} from '../../../../src/hooks/useLostReports';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';

function formatTimeAgoLong(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} horas`;
  const days = Math.round(hours / 24);
  return `hace ${days} días`;
}

export default function ReportFoundConfirmScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const reportQuery = useLostReportDetail(reportId);
  const resolveMutation = useResolveLostReportMutation(reportId);
  const [busy, setBusy] = useState(false);

  const detail = reportQuery.data;

  const onBack = useCallback((): void => {
    router.back();
  }, [router]);

  const timeAgo = useMemo(() => formatTimeAgoLong(detail?.createdAt ?? null), [detail?.createdAt]);
  const sightingsCount = detail?.sightings?.length ?? 0;

  const onConfirm = useCallback((): void => {
    if (!reportId || busy || resolveMutation.isPending) return;
    Alert.alert(
      '¿Encontraste a tu mascota?',
      'Al marcar a tu mascota como encontrada, se cerrará el reporte activo y se notificará a los usuarios que ayudaron en la búsqueda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como encontrado',
          style: 'default',
          onPress: async (): Promise<void> => {
            setBusy(true);
            try {
              const res = await resolveMutation.mutateAsync(undefined);
              const qs = new URLSearchParams();
              if (res.resolvedAt) qs.set('resolvedAt', res.resolvedAt);
              if (res.notifiedUsersCount != null)
                qs.set('notified', String(res.notifiedUsersCount));
              if (res.sightingsCount != null) qs.set('sightings', String(res.sightingsCount));
              if (res.totalMinutes != null) qs.set('totalMinutes', String(res.totalMinutes));
              router.replace(`/(app)/reports/${reportId}/found-success?${qs.toString()}`);
            } catch {
              Alert.alert(
                'Error',
                'No se pudo marcar el reporte como encontrado. Intenta nuevamente.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, [busy, reportId, resolveMutation, router]);

  if (reportQuery.isPending || !detail) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Reporte de mascota" onBack={onBack} testID="report.found" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.thumbWrap}>
              {detail.petPhotoUrl ? (
                <Image source={{ uri: detail.petPhotoUrl }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbFallback} />
              )}
            </View>
            <View style={styles.meta}>
              <Text style={styles.petName}>{detail.petName}</Text>
              <Text style={styles.petSub}>
                {detail.petSpecies}
                {detail.petBreed ? ` • ${detail.petBreed}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.statusBox}>
            <View style={styles.statusDot} />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Reportado como perdido</Text>
              <Text style={styles.statusSub}>
                {timeAgo} · {sightingsCount} avistamientos
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={[styles.greenBtn, (busy || resolveMutation.isPending) && styles.disabled]}
            disabled={busy || resolveMutation.isPending}
            testID="report.found.confirm"
          >
            {busy || resolveMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            )}
            <Text style={styles.greenBtnText}>Marcar como encontrado</Text>
          </Pressable>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>¿Encontraste a tu mascota?</Text>
          <Text style={styles.infoText}>
            Al marcar a Max como encontrado, se cerrará el reporte activo y se notificará a todos
            los usuarios que ayudaron en la búsqueda.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  loadingText: { ...typography.caption, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.md,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#ECEFF5',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { width: '100%', height: '100%', backgroundColor: '#ECEFF5' },
  meta: { flex: 1, gap: 2 },
  petName: { ...typography.bodyStrong, color: colors.textPrimary },
  petSub: { ...typography.caption, color: colors.textSecondary },

  statusBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  statusText: { flex: 1, gap: 2 },
  statusTitle: { ...typography.caption, color: colors.dangerDark, fontWeight: '800' },
  statusSub: { ...typography.caption, color: colors.textSecondary },

  greenBtn: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.button,
  },
  greenBtnText: { ...typography.bodyStrong, color: colors.white },
  disabled: { opacity: 0.6 },

  info: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.20)',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.bodyStrong, color: colors.success },
  infoText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
});
