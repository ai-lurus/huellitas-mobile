import React, { useMemo } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useLostReportDetail } from '../../../../src/hooks/useLostReports';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';

export default function ReportFoundSuccessWebScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, notified, sightings, totalMinutes } = useLocalSearchParams<{
    id: string;
    notified?: string;
    sightings?: string;
    totalMinutes?: string;
  }>();

  const reportId = id ?? '';
  const detailQuery = useLostReportDetail(reportId);
  const petName = detailQuery.data?.petName ?? 'tu mascota';

  const shareMessage = useMemo(
    () => `¡${petName} está en casa! Gracias a la comunidad Huellitas.`,
    [petName],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.root} testID="report.found.success.web">
        <View style={styles.check}>
          <Ionicons name="checkmark" size={20} color={colors.white} />
        </View>
        <Text style={styles.title}>¡{petName} está en casa!</Text>
        <Text style={styles.subtitle}>Gracias a la comunidad Huellitas</Text>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumOrange}>{notified ?? '—'}</Text>
            <Text style={styles.statLabel}>Personas ayudaron</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNumBlue}>{sightings ?? '—'}</Text>
            <Text style={styles.statLabel}>Avistamientos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNumGreen}>
              {totalMinutes ? `${Math.round(Number(totalMinutes) / 60)}h` : '—'}
            </Text>
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.shareBtn}
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

        <Pressable accessibilityRole="button" onPress={() => router.replace('/(app)')}>
          <Text style={styles.doneText}>Listo</Text>
        </Pressable>
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
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
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
});
