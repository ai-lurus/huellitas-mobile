import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import type { MyLostReportSummary } from '../../../src/domain/lostReports';
import { useMyReports } from '../../../src/hooks/useLostReports';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import {
  loadPendingRadarReport,
  type PendingRadarReportDraft,
} from '../../../src/services/pendingRadarReportStore';

function pendingLabel(draft: PendingRadarReportDraft): string {
  return draft.kind === 'lost' ? 'Reporte de mascota perdida' : 'Reporte de mascota callejera';
}

function ReportRow({ report }: { report: MyLostReportSummary }): React.JSX.Element {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      testID={`profile.reports.item.${report.id}`}
      onPress={() => router.push(`/(app)/reports/${report.id}`)}
      style={styles.row}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{report.petName}</Text>
        <Text style={styles.rowSubtitle}>
          {report.reportKind === 'resolved'
            ? 'Resuelto'
            : report.reportKind === 'sighted'
              ? 'Avistamiento'
              : 'Perdido'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function MyReportsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useMyReports();
  const [pendingDraft, setPendingDraft] = useState<PendingRadarReportDraft | null>(null);

  useEffect((): (() => void) => {
    let cancelled = false;
    void loadPendingRadarReport().then((draft): void => {
      if (!cancelled) setPendingDraft(draft);
    });
    return (): void => {
      cancelled = true;
    };
  }, []);

  const reports = useMemo(() => data ?? [], [data]);
  const activos = useMemo(() => reports.filter((r) => r.reportKind !== 'resolved'), [reports]);
  const resueltos = useMemo(() => reports.filter((r) => r.reportKind === 'resolved'), [reports]);
  const isEmpty =
    !isPending && !isError && activos.length === 0 && resueltos.length === 0 && !pendingDraft;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Mis reportes" onBack={() => router.back()} testID="profile.reports" />

      <ScrollView contentContainerStyle={styles.content} testID="profile.reports.screen">
        {isPending ? (
          <ActivityIndicator color={colors.navActive} />
        ) : isError ? (
          <View style={styles.card} testID="profile.reports.error">
            <Text style={styles.rowTitle}>No se pudieron cargar tus reportes</Text>
            <Pressable
              accessibilityRole="button"
              testID="profile.reports.retry"
              onPress={() => void refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : isEmpty ? (
          <View style={styles.card} testID="profile.reports.empty">
            <Text style={styles.rowSubtitle}>Aún no has creado reportes en Radar.</Text>
          </View>
        ) : (
          <>
            {activos.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>ACTIVOS</Text>
                <View style={styles.card}>
                  {activos.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 ? <View style={styles.divider} /> : null}
                      <ReportRow report={r} />
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {pendingDraft ? (
              <>
                <Text style={styles.sectionLabel}>PENDIENTES DE ENVIAR</Text>
                <View style={styles.card}>
                  <View style={styles.row} testID="profile.reports.pending">
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowTitle}>{pendingLabel(pendingDraft)}</Text>
                      <Text style={styles.rowSubtitle}>
                        Sin conexión al crearse · se enviará automáticamente
                      </Text>
                    </View>
                    <Ionicons name="cloud-offline-outline" size={18} color={colors.textMuted} />
                  </View>
                </View>
              </>
            ) : null}

            {resueltos.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>RESUELTOS</Text>
                <View style={styles.card}>
                  {resueltos.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 ? <View style={styles.divider} /> : null}
                      <ReportRow report={r} />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.caption,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLeft: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowTitle: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.navActive,
  },
  retryText: {
    color: colors.white,
    ...typography.button,
  },
});
