import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  LostReportDataStep,
  type LostReportDataResult,
} from '../../../../src/components/radar/wizard/LostReportDataStep';
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
import { colors, spacing, typography } from '../../../../src/design/tokens';
import { isLostReportArchived } from '../../../../src/domain/lostReports';
import {
  useLostReportDetail,
  useUpdateLostReportMutation,
} from '../../../../src/hooks/useLostReports';
import { useAuthStore } from '../../../../src/stores/authStore';

export default function ReportEditScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const isGuest = useAuthStore((s) => s.isGuest);

  useEffect((): void => {
    if (isGuest) {
      router.back();
    }
  }, [isGuest, router]);

  const reportQuery = useLostReportDetail(reportId);
  const updateMutation = useUpdateLostReportMutation(reportId);
  const [saving, setSaving] = useState(false);

  const detail = reportQuery.data;

  const onBack = useCallback((): void => {
    router.back();
  }, [router]);

  const onSubmit = useCallback(
    (data: LostReportDataResult): void => {
      if (saving) return;
      setSaving(true);
      void updateMutation
        .mutateAsync({
          lat: data.lat,
          lng: data.lng,
          lastSeenAt: data.lastSeenAt.toISOString(),
          message: data.message,
        })
        .then(() => {
          router.back();
        })
        .catch(() => {
          Alert.alert('No se pudo guardar', 'Intenta nuevamente en unos segundos.');
        })
        .finally(() => {
          setSaving(false);
        });
    },
    [router, saving, updateMutation],
  );

  if (reportQuery.isPending || !detail) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isResolved = Boolean(detail.resolvedAt);
  const isArchived = isLostReportArchived(detail.createdAt, isResolved);

  return (
    <View style={styles.safe}>
      <ScreenHeader title="Editar reporte" onBack={onBack} testID="report.edit" />

      {isResolved || isArchived ? (
        <View style={styles.center} testID="report.edit.blocked">
          <Text style={styles.blockedText}>
            {isResolved
              ? 'Este reporte ya está resuelto y no se puede editar.'
              : 'Este reporte está inactivo y no se puede editar.'}
          </Text>
        </View>
      ) : (
        <LostReportDataStep
          initialLastSeenAt={detail.lastSeenAt ? new Date(detail.lastSeenAt) : new Date()}
          initialLocation={detail.lossLocation}
          initialMessage={detail.message ?? ''}
          onSubmit={onSubmit}
          pet={{
            name: detail.petName,
            species: detail.petSpecies,
            photos: detail.petPhotoUrl ? [detail.petPhotoUrl] : [],
          }}
          submitLabel={saving ? 'Guardando…' : 'Guardar cambios'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  blockedText: { ...typography.bodyStrong, color: colors.textSecondary, textAlign: 'center' },
});
