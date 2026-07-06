import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { useStrayReportDetail, useMatchStrayReport } from '../../../src/hooks/useStrayReports';
import { useLostReports } from '../../../src/hooks/useLostReports';
import { useAuthStore } from '../../../src/stores/authStore';
import { useLocationStore } from '../../../src/stores/locationStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Animal',
};

export default function StrayDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const currentLocation = useLocationStore((s) => s.currentLocation) ?? DEFAULT_MAP_FALLBACK;

  const { data: stray, isLoading, isError } = useStrayReportDetail(id ?? '');

  // Fetch user's active lost reports to show "Esta es mi mascota" button
  const { data: nearbyReports } = useLostReports({
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    radius: 50, // large radius — we just want the user's own reports
  });

  const matchMutation = useMatchStrayReport();

  const myActiveLostReport = nearbyReports?.find(
    (r) =>
      r.userId === userId &&
      r.reportKind !== 'resolved' &&
      stray != null &&
      r.petSpecies === stray.species,
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError || stray == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar el reporte.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const speciesLabel = SPECIES_LABELS[stray.species] ?? 'Animal';

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={`${speciesLabel} suelto`}
        onBack={() => router.back()}
        testID="stray-detail"
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {stray.photoUrl != null ? (
          <Image
            source={{ uri: stray.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
            testID="stray-detail.photo"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="help-circle" size={60} color={colors.accent} />
          </View>
        )}

        <View style={styles.infoCard}>
          <InfoRow label="Tipo" value={speciesLabel} />
          {stray.color != null && stray.color.length > 0 ? (
            <InfoRow label="Color" value={stray.color} />
          ) : null}
          {stray.description != null && stray.description.length > 0 ? (
            <InfoRow label="Descripción" value={stray.description} />
          ) : null}
          <InfoRow
            label="Visto el"
            value={new Date(stray.seenAt).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </View>

        {stray.status === 'unmatched' && myActiveLostReport != null ? (
          <Pressable
            onPress={() =>
              matchMutation.mutate(
                { strayId: stray.id, lostReportId: myActiveLostReport.id },
                { onSuccess: () => router.replace(`/(app)/reports/${myActiveLostReport.id}`) },
              )
            }
            disabled={matchMutation.isPending}
            style={[styles.matchBtn, matchMutation.isPending && styles.matchBtnDisabled]}
            testID="stray-detail.match"
          >
            {matchMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.matchBtnLabel}>
                ¡Esta es mi mascota ({myActiveLostReport.petName})!
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  photo: {
    marginHorizontal: spacing.md,
    height: 220,
    borderRadius: radius.xl,
  },
  photoPlaceholder: {
    marginHorizontal: spacing.md,
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 138, 52, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.label, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  matchBtn: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.success,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  matchBtnDisabled: { opacity: 0.6 },
  matchBtnLabel: { ...typography.button, color: colors.white },
  errorText: { ...typography.body, color: colors.textSecondary },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
  },
  backBtnLabel: { ...typography.button, color: colors.white },
});
