import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';

import { Skeleton } from '../../../src/components/skeleton/Skeleton';
import { useUserProfile } from '../../../src/hooks/useUserProfile';
import type { ActiveUserReport } from '../../../src/domain/userProfile';
import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';

function formatJoinDateEs(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(d);
}

function reportBadgeLabel(kind: ActiveUserReport['reportKind']): {
  label: string;
  bg: string;
  dot: string;
} {
  const k = kind ?? 'lost';
  if (k === 'sighted') return { label: 'VISTO', bg: 'rgba(59, 130, 246, 0.95)', dot: '#fff' };
  return { label: 'PERDIDO', bg: 'rgba(225, 29, 72, 0.95)', dot: '#fff' };
}

function ActiveReportItem({
  report,
  onPress,
}: {
  report: ActiveUserReport;
  onPress: () => void;
}): React.JSX.Element {
  const badge = reportBadgeLabel(report.reportKind);
  return (
    <Pressable onPress={onPress} style={styles.reportItem} accessibilityRole="button">
      <View style={[styles.reportBadge, { backgroundColor: badge.bg }]}>
        <View style={styles.reportBadgeDot} />
        <Text style={styles.reportBadgeText}>{badge.label}</Text>
      </View>
      <View style={styles.reportThumbWrap}>
        {report.petPhotoUrl ? (
          <Image
            source={{ uri: report.petPhotoUrl }}
            style={styles.reportThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.reportThumb, styles.reportThumbFallback]} />
        )}
      </View>
      <View style={styles.reportMeta}>
        <Text style={styles.reportPetName} numberOfLines={1}>
          {report.petName}
        </Text>
        <Text style={styles.reportPetSub} numberOfLines={1}>
          {report.petSpecies}
          {report.petBreed ? ` • ${report.petBreed}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function PublicProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id ?? '';

  const profileQuery = useUserProfile(userId);
  const profile = profileQuery.data;

  const onBack = useCallback((): void => router.back(), [router]);

  const joinLabel = useMemo(() => {
    if (!profile) return '';
    return formatJoinDateEs(profile.joinedAt ?? profile.createdAt ?? '');
  }, [profile]);

  const medalsLabel = useMemo(() => {
    if (!profile) return '';
    const med = profile.medalsCount;
    const helped = profile.petsHelpedCount;
    if (typeof med === 'number') return `Medallas: ${med}`;
    if (typeof helped === 'number') return `Mascotas ayudadas: ${helped}`;
    return `Reportes activos: ${(profile.activeReports?.length ?? 0).toString()}`;
  }, [profile]);

  const openContact = useCallback(async (): Promise<void> => {
    if (!profile) return;

    const email = profile.email;
    const phone = profile.phone;

    if (phone) {
      const digits = phone.replace(/[^\d]/g, '');
      if (digits.length > 0) {
        const url = `https://wa.me/${digits}`;
        await Linking.openURL(url);
        return;
      }
    }

    if (email) {
      const subject = encodeURIComponent('Huellitas - contacto');
      const body = encodeURIComponent('Hola, vi tu reporte en Huellitas.');
      const url = `mailto:${email}?subject=${subject}&body=${body}`;
      await Linking.openURL(url);
      return;
    }

    Alert.alert(
      'No hay datos de contacto',
      'Este usuario no tiene email ni número de WhatsApp configurado.',
    );
  }, [profile]);

  const onPressReport = useCallback(
    (reportId: string): void => {
      router.push(`/(app)/reports/${reportId}`);
    },
    [router],
  );

  if (profileQuery.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loadingWrap} testID="profile.public.skeleton">
          <View style={styles.skelHeaderRow}>
            <Skeleton style={styles.skelCircle} borderRadius={20} />
            <Skeleton style={styles.skelTitle} borderRadius={10} />
            <Skeleton style={styles.skelCircle} borderRadius={20} />
          </View>

          <View style={styles.skelCard}>
            <Skeleton style={styles.skelAvatar} borderRadius={56} />
            <Skeleton style={styles.skelName} borderRadius={10} />
            <Skeleton style={styles.skelMeta} borderRadius={10} />
            <Skeleton style={styles.skelPill} borderRadius={999} />
          </View>

          <View style={styles.skelList}>
            <Skeleton style={styles.skelRow} borderRadius={16} />
            <Skeleton style={styles.skelRow} borderRadius={16} />
            <Skeleton style={styles.skelRow} borderRadius={16} />
          </View>

          <View style={styles.skelFooterNote}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Cargando perfil…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Perfil no disponible</Text>
          <Pressable
            onPress={() => profileQuery.refetch()}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader title={profile.name} onBack={onBack} testID="profile" />

      <ScrollView contentContainerStyle={styles.content} testID="profile.public.screen">
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile.imageUrl ? (
              <Image source={{ uri: profile.imageUrl }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]} />
            )}
          </View>

          <Text style={styles.name} testID="profile.public.name">
            {profile.name}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{joinLabel ? `Miembro desde ${joinLabel}` : '—'}</Text>
          </View>

          <View style={styles.medalsPill} testID="profile.public.medals">
            <Text style={styles.medalsPillText}>{medalsLabel}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reportes activos</Text>
          <Text style={styles.sectionSub}>{profile.activeReports?.length ?? 0}</Text>
        </View>

        {profile.activeReports && profile.activeReports.length > 0 ? (
          <View style={styles.reportsList}>
            {profile.activeReports.map((r) => (
              <ActiveReportItem key={r.id} report={r} onPress={() => onPressReport(r.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyReports}>
            <Ionicons name="infinite-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.emptyReportsText}>Aún no tiene reportes activos.</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => void openContact()}
          style={styles.contactBtn}
          testID="profile.contact"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.white} />
          <Text style={styles.contactBtnText}>Contactar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: { ...typography.bodyStrong, color: colors.textSecondary },
  skelHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skelCircle: { width: 40, height: 40 },
  skelTitle: { height: 20, width: '55%' },
  skelCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  skelAvatar: { width: 112, height: 112 },
  skelName: { width: '60%', height: 22 },
  skelMeta: { width: '70%', height: 14 },
  skelPill: { width: '70%', height: 28 },
  skelList: { width: '100%', gap: spacing.sm },
  skelRow: { width: '100%', height: 82 },
  skelFooterNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.textSecondary },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.button,
  },
  retryText: { ...typography.button, color: colors.white },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.navActive,
    ...shadows.md,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: 'rgba(94, 114, 228, 0.25)' },
  name: { ...typography.heading, color: colors.textPrimary, fontSize: 26, textAlign: 'center' },

  metaRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  metaText: { ...typography.caption, color: colors.textSecondary },
  medalsPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(94, 114, 228, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94, 114, 228, 0.25)',
  },
  medalsPillText: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 18 },
  sectionSub: { ...typography.caption, color: colors.textSecondary },

  reportsList: { gap: spacing.sm },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.md,
    gap: spacing.md,
  },
  reportBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    zIndex: 2,
  },
  reportBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  reportBadgeText: { ...typography.caption, color: colors.white, fontWeight: '800' },
  reportThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ECEFF5',
  },
  reportThumb: { width: '100%', height: '100%' },
  reportThumbFallback: { backgroundColor: '#ECEFF5' },
  reportMeta: { flex: 1, gap: 2, paddingLeft: 6 },
  reportPetName: { ...typography.bodyStrong, color: colors.textPrimary },
  reportPetSub: { ...typography.caption, color: colors.textSecondary },

  emptyReports: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyReportsText: { ...typography.bodyStrong, color: colors.textSecondary, textAlign: 'center' },

  contactBtn: {
    marginTop: spacing.md,
    width: '100%',
    minHeight: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  contactBtnText: { ...typography.bodyStrong, color: colors.white },
});
