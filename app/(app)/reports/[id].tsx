import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Share,
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
import { useLostReportDetail } from '../../../src/hooks/useLostReports';
import type { LostReportSighting } from '../../../src/domain/lostReportDetail';
import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { distanceMeters } from '../../../src/utils/geo';
import { useLocationStore } from '../../../src/stores/locationStore';
import { useUserProfile } from '../../../src/hooks/useUserProfile';
import { useReverseGeocodeLabel } from '../../../src/hooks/useReverseGeocodeLabel';

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
      <View style={styles.gridRow}>
        {(extra > 0 ? [...shown, '__extra__'] : shown).map((item, idx) => {
          if (item === '__extra__') {
            return (
              <View key={`extra-${idx}`} style={[styles.photoTile, styles.photoTileExtra]}>
                <Text style={styles.photoTileExtraText}>+{extra}</Text>
              </View>
            );
          }
          return (
            <Image
              key={`${item}-${idx}`}
              source={{ uri: item as string }}
              style={styles.photoTile}
              resizeMode="cover"
              accessibilityLabel="Foto del avistamiento"
            />
          );
        })}
      </View>
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
  const meName = useAuthStore((s) => s.user?.name) ?? '—';
  const reportQuery = useLostReportDetail(reportId);
  const errorAlertShown = useRef(false);
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const detail = reportQuery.data;

  const isOwner = useMemo(() => {
    if (!detail?.ownerId || !meId) return false;
    return detail.ownerId === meId;
  }, [detail?.ownerId, meId]);

  const isResolved = Boolean(detail?.resolvedAt);

  const ownerProfileQuery = useUserProfile(!isOwner && detail?.ownerId ? detail.ownerId : '');
  const ownerProfile = ownerProfileQuery.data;

  const placeLabelQuery = useReverseGeocodeLabel(detail?.lossLocation);
  const placeLabel = useMemo(() => {
    if (!detail) return '—';
    return (
      placeLabelQuery.data ??
      `${detail.lossLocation.lat.toFixed(5)}, ${detail.lossLocation.lng.toFixed(5)}`
    );
  }, [detail, placeLabelQuery.data]);

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

  const onShare = useCallback(async (): Promise<void> => {
    if (!detail) return;
    const title = `Huellitas - ${detail.petName}`;
    const message =
      detail.message?.trim() ||
      `Ayúdanos a encontrar a ${detail.petName}. Abre la app para ver el reporte.`;
    try {
      await Share.share({ title, message });
    } catch {
      // no-op
    }
  }, [detail]);

  const onFound = useCallback((): void => {
    if (!reportId || isResolved) return;
    router.push(`/(app)/reports/${reportId}/found`);
  }, [isResolved, reportId, router]);

  useEffect(() => {
    if (!reportQuery.isPending && reportQuery.isError && !errorAlertShown.current) {
      errorAlertShown.current = true;
      Alert.alert('Error', 'No pudimos cargar el detalle del reporte. Intenta nuevamente.', [
        { text: 'OK', onPress: (): void => router.back() },
      ]);
    }
  }, [reportQuery.isError, reportQuery.isPending, router]);

  const sortedSightings = useMemo(() => {
    const list = detail?.sightings ?? [];
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [detail?.sightings]);

  const distanceKm = useMemo(() => {
    if (!detail || !currentLocation) return null;
    const meters = distanceMeters(currentLocation, detail.lossLocation);
    return meters / 1000;
  }, [currentLocation, detail]);

  const timeAgoLong = useMemo(() => {
    const createdAt = detail?.createdAt;
    if (!createdAt) return null;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    const diff = Math.max(0, Date.now() - d.getTime());
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `hace ${hours} horas`;
    const days = Math.round(hours / 24);
    return `hace ${days} días`;
  }, [detail?.createdAt]);

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID="report.detail.screen"
      >
        <View style={styles.hero}>
          {detail.petPhotoUrl ? (
            <Image
              source={{ uri: detail.petPhotoUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImageFallback]} />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={styles.heroIconBtn}
              testID="report.detail.back"
            >
              <Ionicons color={colors.white} name="chevron-back" size={22} />
            </Pressable>
            <View
              style={[
                styles.heroStatusPill,
                isResolved ? styles.heroStatusResolved : styles.heroStatusLost,
              ]}
            >
              <Text style={styles.heroStatusText}>{isResolved ? 'RESUELTO' : 'PERDIDO'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onShare()}
              style={styles.heroIconBtn}
              testID="report.detail.share"
            >
              <Ionicons color={colors.white} name="share-social-outline" size={20} />
            </Pressable>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroName} testID="report.detail.petName">
              {detail.petName}
            </Text>
            <View style={styles.heroChips}>
              <View style={styles.heroChip}>
                <Ionicons name="paw-outline" size={14} color={colors.textPrimary} />
                <Text style={styles.heroChipText}>
                  {detail.petSpecies === 'dog'
                    ? 'Perro'
                    : detail.petSpecies === 'cat'
                      ? 'Gato'
                      : detail.petSpecies === 'bird'
                        ? 'Ave'
                        : detail.petSpecies === 'rabbit'
                          ? 'Conejo'
                          : 'Otro'}
                </Text>
              </View>
              {detail.petBreed ? (
                <View style={styles.heroChipMuted}>
                  <Text style={styles.heroChipMutedText}>{detail.petBreed}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.bodyPad}>
          {isOwner ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleRed}>Tu mascota</Text>
              <View style={styles.reportedRow}>
                <View style={styles.reportedAvatar}>
                  <Text style={styles.reportedAvatarText}>{meName.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.reportedMeta}>
                  <Text style={styles.reportedLabel}>REPORTADO POR</Text>
                  <Text style={styles.reportedName}>{meName}</Text>
                </View>
                <Text style={styles.reportedTime}>{timeAgoLong ?? '—'}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{sortedSightings.length}</Text>
                  <Text style={styles.statLabel}>AVISTAMIENTOS</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {distanceKm != null ? distanceKm.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.statLabel}>KM AL REPORTE</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {timeAgoLong ? timeAgoLong.replace('hace ', '') : '—'}
                  </Text>
                  <Text style={styles.statLabel}>TIEMPO</Text>
                </View>
              </View>

              {detail.message ? (
                <Text style={styles.message} numberOfLines={4}>
                  {detail.message}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <View style={styles.reportedRow}>
                <View style={styles.reportedAvatar}>
                  <Text style={styles.reportedAvatarText}>
                    {(ownerProfile?.name ?? 'D').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reportedMeta}>
                  <Text style={styles.reportedLabel}>REPORTADO POR SU DUEÑO</Text>
                  <Text style={styles.reportedName}>{ownerProfile?.name ?? '—'}</Text>
                </View>
                <Text style={styles.reportedTime}>{timeAgoLong ?? '—'}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{sortedSightings.length}</Text>
                  <Text style={styles.statLabel}>AVISTAMIENTOS</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {distanceKm != null ? distanceKm.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.statLabel}>KM DE TI</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {timeAgoLong ? timeAgoLong.replace('hace ', '') : '—'}
                  </Text>
                  <Text style={styles.statLabel}>TIEMPO</Text>
                </View>
              </View>

              {detail.message ? (
                <Text style={styles.message} numberOfLines={4}>
                  {detail.message}
                </Text>
              ) : null}

              <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>CONTACTAR AL DUEÑO</Text>
                <View style={styles.contactRow}>
                  <View style={styles.contactLeft}>
                    <Text style={styles.contactName}>{ownerProfile?.name ?? '—'}</Text>
                    <Text style={styles.contactSub}>
                      {ownerProfile?.joinedAt
                        ? `Dueño · Miembro desde ${new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(ownerProfile.joinedAt))}`
                        : 'Dueño'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      detail.ownerId && router.push(`/(app)/profile/${detail.ownerId}`)
                    }
                    style={styles.contactIconBtn}
                    testID="report.detail.contact.profile"
                  >
                    <Ionicons name="person-outline" size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>ÚLTIMA UBICACIÓN</Text>
          </View>
          <View style={styles.mapCard}>
            <LostReportMap
              center={detail.lossLocation}
              radiusMeters={detail.lossRadiusMeters}
              sightings={sortedSightings}
              testID="report.detail.map"
            />
            <View style={styles.mapBottomRow}>
              <View style={styles.mapBottomLeft}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.mapBottomText} numberOfLines={1}>
                  {placeLabel}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.mapMiniBtn}
                testID="report.detail.viewMap"
                onPress={() => router.push(`/(app)/reports/${reportId}/map`)}
              >
                <Text style={styles.mapMiniBtnText}>VER MAPA</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>AVISTAMIENTOS {sortedSightings.length}</Text>
          </View>

          {sortedSightings.length === 0 ? (
            <View style={styles.emptyTimeline} testID="report.detail.timeline.empty">
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.emptyTimelineText}>Aún no hay avistamientos.</Text>
            </View>
          ) : (
            <View style={styles.timelineList} testID="report.detail.timeline.list">
              {sortedSightings.map((s) => (
                <SightingTimelineItem key={s.id} sighting={s} onPressProfile={openProfile} />
              ))}
            </View>
          )}

          {isOwner ? (
            <View style={styles.bottomActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isResolved}
                onPress={() => void onFound()}
                style={[styles.primaryGreen, isResolved && styles.disabled]}
                testID="report.detail.markFound"
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                <Text style={styles.primaryGreenText}>Marcar como encontrada</Text>
              </Pressable>
              <View style={styles.bottomRowActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void onShare()}
                  style={styles.secondaryBtn}
                  testID="report.detail.shareBottom"
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Compartir alerta</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={onEditReport}
                  style={styles.secondaryBtn}
                  testID="report.detail.edit"
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.secondaryBtnText}>Editar reporte</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.bottomActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onReportSighting}
                style={[styles.primaryOrange, isResolved && styles.disabled]}
                testID="report.detail.reportSighting"
                disabled={isResolved}
              >
                <Ionicons name="camera-outline" size={18} color={colors.white} />
                <Text style={styles.primaryOrangeText}>Reportar avistamiento</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void onShare()}
                style={styles.shareLink}
                testID="report.detail.shareLink"
              >
                <Ionicons name="share-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.shareLinkText}>Compartir alerta</Text>
              </Pressable>
            </View>
          )}
        </View>
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

  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxxl },

  hero: { height: 250, backgroundColor: '#ECEFF5' },
  heroImage: { width: '100%', height: '100%' },
  heroImageFallback: { backgroundColor: '#ECEFF5' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  heroTopRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroStatusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  heroStatusLost: { backgroundColor: colors.navActive },
  heroStatusResolved: { backgroundColor: colors.success },
  heroStatusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  heroBottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  heroName: { ...typography.title, color: colors.white, fontSize: 30 },
  heroChips: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  heroChipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  heroChipMuted: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroChipMutedText: { ...typography.caption, color: colors.white, fontWeight: '700' },

  bodyPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
    gap: spacing.md,
  },
  sectionTitleRed: { ...typography.bodyStrong, color: colors.navActive },
  reportedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reportedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECEFF5',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportedAvatarText: { ...typography.bodyStrong, color: colors.textSecondary },
  reportedMeta: { flex: 1, minWidth: 0 },
  reportedLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '800' },
  reportedName: { ...typography.bodyStrong, color: colors.textPrimary },
  reportedTime: { ...typography.caption, color: colors.textMuted },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statValue: { ...typography.heading, color: colors.textPrimary, fontSize: 18 },
  statLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '800', fontSize: 10 },
  message: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },

  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  contactTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  contactLeft: { flex: 1, minWidth: 0, gap: 2 },
  contactName: { ...typography.bodyStrong, color: colors.textPrimary },
  contactSub: { ...typography.caption, color: colors.textMuted },
  contactIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  sectionHeaderRow: { paddingHorizontal: 2 },
  sectionHeader: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mapBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  mapBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  mapBottomText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  mapMiniBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(60,60,70,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapMiniBtnText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 10,
  },
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

  bottomActions: { gap: spacing.sm, paddingTop: spacing.sm },
  primaryGreen: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.button,
  },
  primaryGreenText: { ...typography.bodyStrong, color: colors.white },
  bottomRowActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  secondaryBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '800' },
  primaryOrange: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.button,
  },
  primaryOrangeText: { ...typography.bodyStrong, color: colors.white },
  shareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  shareLinkText: { ...typography.bodyStrong, color: colors.textPrimary },
  disabled: { opacity: 0.6 },

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
