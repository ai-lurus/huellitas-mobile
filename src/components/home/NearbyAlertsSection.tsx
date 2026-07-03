import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LostReport } from '../../domain/lostReports';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { HomeReportCard } from '../reports/HomeReportCard';

const MAX_VISIBLE_REPORTS = 2;

export interface NearbyAlertsSectionProps {
  reports: readonly LostReport[];
  isLoading: boolean;
  onReportPress: (report: LostReport) => void;
  onSeeAll: () => void;
  testID?: string;
}

export function NearbyAlertsSection({
  reports,
  isLoading,
  onReportPress,
  onSeeAll,
  testID = 'home.nearbyAlerts',
}: NearbyAlertsSectionProps): React.JSX.Element {
  const nearest = [...reports]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, MAX_VISIBLE_REPORTS);

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Alertas cerca de ti</Text>
        <Pressable onPress={onSeeAll} testID="home.nearbyAlerts.see-all">
          <Text style={styles.link}>Ver todas</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered} testID="home.nearbyAlerts.loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : nearest.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Sin alertas cerca de ti por ahora</Text>
        </View>
      ) : (
        nearest.map((report) => (
          <HomeReportCard key={report.id} report={report} onPress={() => onReportPress(report)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  centered: { paddingVertical: spacing.lg, alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    ...shadows.md,
  },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
