import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LostReportMap } from '../../../src/components/map/LostReportMap';

import { useAuthStore } from '../../../src/stores/authStore';
import {
  useLostReportDetail,
  useResolveLostReportMutation,
} from '../../../src/hooks/useLostReports';
import type { LostReportSighting } from '../../../src/domain/lostReportDetail';
import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';

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

function SmallPhotoGrid({
  photos,
  maxTiles = 6,
}: {
  photos: string[] | undefined;
  maxTiles?: number;
}): React.JSX.Element | null {
  const list = photos ?? [];
  if (list.length === 0) return null;
  const shown = list.slice(0, maxTiles);
  const extra = Math.max(0, list.length - shown.length);
  return (
    <View style={styles.gridWrap} testID="report.detail.sighting.photoGrid">
      <FlatList
        scrollEnabled={false}
        data={extra > 0 ? [...shown, '__extra__'] : shown}
        keyExtractor={(_, idx) => String(idx)}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          if (item === '__extra__') {
            return (
              <View style={[styles.photoTile, styles.photoTileExtra]}>
                <Text style={styles.photoTileExtraText}>+{extra}</Text>
              </View>
            );
          }
          return (
            <Image
              source={{ uri: item as string }}
              style={styles.photoTile}
              resizeMode="cover"
              accessibilityLabel="Foto del avistamiento"
            />
          );
        }}
      />
    </View>
  );
}

function SightingTimelineItem({
  sighting,
  onPressProfile,
}: {
  sighting: LostReportSighting;
  onPressProfile: (id: string) => void;
}): React.JSX.Element {
  const photos = sighting.photoUrls ?? [];
  return (
    <View style={styles.sightingCard}>
      <View style={styles.sightingHeader}>
        <Pressable
          onPress={() => onPressProfile(sighting.user.id)}
          style={styles.userRow}
          testID={`report.detail.sighting.user.${sighting.user.id}`}
        >
          {sighting.user.imageUrl ? (
            <Image
              source={{ uri: sighting.user.imageUrl }}
              style={styles.avatar}
              accessibilityLabel="Avatar"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{sighting.user.name}</Text>
            <Text style={styles.userTime}>{formatTimeAgo(sighting.createdAt)}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.sightingBody}>
        {sighting.notes ? <Text style={styles.noteText}>{sighting.notes}</Text> : null}
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.locText}>
            {sighting.location.lat.toFixed(5)}, {sighting.location.lng.toFixed(5)}
          </Text>
        </View>
        <SmallPhotoGrid photos={photos} />
      </View>
    </View>
  );
}

export default function ReportDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const meId = useAuthStore((s) => s.user?.id);
  const reportQuery = useLostReportDetail(reportId);
  const resolveMutation = useResolveLostReportMutation(reportId);

  const [confirmingResolve, setConfirmingResolve] = useState(false);

  const detail = reportQuery.data;

  const isOwner = useMemo(() => {
    if (!detail?.ownerId || !meId) return false;
    return detail.ownerId === meId;
  }, [detail?.ownerId, meId]);

  const isResolved = Boolean(detail?.resolvedAt);

  const onBack = useCallback((): void => {
    router.back();
  }, [router]);

  const openProfile = useCallback(
    (userId: string): void => {
      router.push(`/(app)/profile/${userId}`);
    },
    [router],
  );

  const onReportSighting = useCallback((): void => {
    router.push(`/(app)/reports/${reportId}/sighting`);
  }, [reportId, router]);

  const onEditReport = useCallback((): void => {
    Alert.alert('Próximamente', 'La edición de reportes aún no está disponible en esta versión.');
  }, []);

  const onFound = useCallback(async (): Promise<void> => {
    if (!reportId || isResolved || confirmingResolve) return;
    setConfirmingResolve(true);
    Alert.alert('¿Confirmar?', 'Al marcar “¡La encontré!” estás ayudando a cerrar el caso.', [
      { text: 'Cancelar', style: 'cancel', onPress: () => setConfirmingResolve(false) },
      {
        text: 'Sí, la encontré',
        style: 'default',
        onPress: async () => {
          try {
            await resolveMutation.mutateAsync(undefined);
            router.replace('/(app)/reports/success');
          } catch {
            Alert.alert('Error', 'No se pudo marcar el reporte como resuelto. Intenta nuevamente.');
          } finally {
            setConfirmingResolve(false);
          }
        },
      },
    ]);
  }, [confirmingResolve, isResolved, reportId, resolveMutation, router]);

  useEffect(() => {
    if (!reportQuery.isPending && reportQuery.isError) {
      Alert.alert('Error', 'No pudimos cargar el detalle del reporte. Intenta nuevamente.');
    }
  }, [reportQuery.isError, reportQuery.isPending]);

  const sortedSightings = useMemo(() => {
    const list = detail?.sightings ?? [];
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [detail?.sightings]);

  if (reportQuery.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando reporte…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No se pudo cargar el reporte</Text>
          <Pressable
            onPress={() => reportQuery.refetch()}
            style={styles.retryBtn}
            accessibilityRole="button"
            testID="report.detail.retry"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backBtn}
          testID="report.detail.back"
        >
          <Ionicons color={colors.textPrimary} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Detalle del reporte
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="report.detail.screen"
      >
        <View style={styles.petCard}>
          <View style={styles.petPhotoWrap}>
            {detail.petPhotoUrl ? (
              <Image
                source={{ uri: detail.petPhotoUrl }}
                style={styles.petPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.petPhoto, styles.petPhotoFallback]} />
            )}
            <View
              style={[
                styles.statusBadge,
                isResolved ? styles.statusBadgeResolved : styles.statusBadgeActive,
              ]}
            >
              <Text style={styles.statusBadgeText}>{isResolved ? 'RESUELTO' : 'EN BÚSQUEDA'}</Text>
            </View>
          </View>

          <View style={styles.petMeta}>
            <Text style={styles.petName} testID="report.detail.petName">
              {detail.petName}
            </Text>
            <Text style={styles.petSub}>
              {detail.petSpecies}
              {detail.petBreed ? ` • ${detail.petBreed}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {isOwner ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={onEditReport}
                style={styles.actionBtnSecondary}
                testID="report.detail.edit"
              >
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.actionBtnSecondaryText}>Editar reporte</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isResolved || resolveMutation.isPending}
                onPress={() => void onFound()}
                style={[
                  styles.actionBtnPrimary,
                  (isResolved || resolveMutation.isPending) && styles.actionBtnPrimaryDisabled,
                ]}
                testID="report.detail.markFound"
              >
                {resolveMutation.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                )}
                <Text style={styles.actionBtnPrimaryText}>¡La encontré!</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={onReportSighting}
              style={styles.communityBtn}
              testID="report.detail.reportSighting"
              disabled={isResolved}
            >
              <Ionicons name="camera-outline" size={18} color={colors.white} />
              <Text style={styles.communityBtnText}>Informar avistamiento</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.mapCard}>
          <LostReportMap
            center={detail.lossLocation}
            radiusMeters={detail.lossRadiusMeters}
            sightings={sortedSightings}
            testID="report.detail.map"
          />

          <View style={styles.mapFooter}>
            <View style={styles.mapFooterRow}>
              <Ionicons name="radio-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.mapFooterText}>
                Radio de pérdida:{' '}
                {detail.lossRadiusMeters ? `${Math.round(detail.lossRadiusMeters / 1000)} km` : '—'}
              </Text>
            </View>
            <View style={styles.mapFooterRow}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.mapFooterText}>{sortedSightings.length} avistamientos</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Timeline de avistamientos</Text>
          <Text style={styles.timelineSub}>
            {sortedSightings.length === 0 ? 'Aún no hay reportes' : 'Los últimos primero'}
          </Text>
        </View>

        {sortedSightings.length === 0 ? (
          <View style={styles.emptyTimeline} testID="report.detail.timeline.empty">
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.emptyTimelineText}>No hay avistamientos reportados todavía.</Text>
          </View>
        ) : (
          <View style={styles.timelineList} testID="report.detail.timeline.list">
            {sortedSightings.map((s) => (
              <SightingTimelineItem key={s.id} sighting={s} onPressProfile={openProfile} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodyStrong, color: colors.textSecondary },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  retryText: { ...typography.button, color: colors.white },

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

  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  petCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  petPhotoWrap: { position: 'relative', height: 210, backgroundColor: colors.background },
  petPhoto: { width: '100%', height: '100%' },
  petPhotoFallback: { backgroundColor: '#ECEFF5' },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusBadgeActive: { backgroundColor: 'rgba(255, 107, 53, 0.95)' },
  statusBadgeResolved: { backgroundColor: 'rgba(34, 197, 94, 0.95)' },
  statusBadgeText: { ...typography.caption, color: colors.white, fontWeight: '800' },
  petMeta: { padding: spacing.md, gap: 2 },
  petName: { ...typography.heading, color: colors.textPrimary, fontSize: 24 },
  petSub: { ...typography.caption, color: colors.textSecondary },

  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtnSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.button,
  },
  actionBtnSecondaryText: { ...typography.bodyStrong, color: colors.textSecondary },
  actionBtnPrimary: {
    flex: 1.3,
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.button,
  },
  actionBtnPrimaryDisabled: { opacity: 0.6 },
  actionBtnPrimaryText: { ...typography.bodyStrong, color: colors.white },

  communityBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.button,
  },
  communityBtnText: { ...typography.bodyStrong, color: colors.white },

  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  map: { width: '100%', height: 260 },
  mapLoading: { width: '100%', height: 260, alignItems: 'center', justifyContent: 'center' },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  mapFooterRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  mapFooterText: { ...typography.caption, color: colors.textSecondary },

  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  timelineTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 18 },
  timelineSub: { ...typography.caption, color: colors.textSecondary },
  emptyTimeline: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTimelineText: { ...typography.bodyStrong, color: colors.textSecondary, textAlign: 'center' },
  timelineList: { gap: spacing.sm },

  sightingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  sightingHeader: { marginBottom: spacing.sm },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navActive },
  avatarFallback: { backgroundColor: 'rgba(94, 114, 228, 0.25)' },
  userMeta: { gap: 2 },
  userName: { ...typography.bodyStrong, color: colors.textPrimary },
  userTime: { ...typography.caption, color: colors.textSecondary },
  sightingBody: { gap: spacing.sm },
  noteText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  locText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  gridWrap: { marginTop: spacing.xs },
  gridRow: { justifyContent: 'space-between' },
  photoTile: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  photoTileExtra: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTileExtraText: { ...typography.bodyStrong, color: colors.white },
});
