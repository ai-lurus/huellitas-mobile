import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LostReportMap } from '../../../../src/components/map/LostReportMap';
import { useLostReportDetail } from '../../../../src/hooks/useLostReports';
import { useReverseGeocodeLabel } from '../../../../src/hooks/useReverseGeocodeLabel';
import { colors, radius, spacing, typography } from '../../../../src/design/tokens';

export default function ReportMapScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const reportQuery = useLostReportDetail(reportId);
  const detail = reportQuery.data;

  const labelQuery = useReverseGeocodeLabel(detail?.lossLocation);
  const label = useMemo(() => {
    if (!detail) return '—';
    return (
      labelQuery.data ??
      `${detail.lossLocation.lat.toFixed(5)}, ${detail.lossLocation.lng.toFixed(5)}`
    );
  }, [detail, labelQuery.data]);

  if (reportQuery.isPending || !detail) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando mapa…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="report.map.back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Ver mapa
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.mapWrap} testID="report.map.screen">
        <LostReportMap
          center={detail.lossLocation}
          radiusMeters={detail.lossRadiusMeters}
          sightings={detail.sightings ?? []}
          variant="fullscreen"
          testID="report.map.full"
        />

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.footerText} numberOfLines={1}>
              {label}
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Ionicons name="radio-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.footerText}>
              Radio:{' '}
              {detail.lossRadiusMeters ? `${Math.round(detail.lossRadiusMeters / 1000)} km` : '—'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  mapWrap: { flex: 1 },
  footer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footerText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodyStrong, color: colors.textSecondary },
});
