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

import { colors, radius, spacing, typography } from '../../src/design/tokens';
import { usePublicPetProfile } from '../../src/hooks/usePetQr';

const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Animal',
};

export default function PublicPetProfileScreen(): React.JSX.Element {
  const { qrToken } = useLocalSearchParams<{ qrToken: string }>();
  const router = useRouter();
  const { data: pet, isLoading, isError } = usePublicPetProfile(qrToken ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || pet == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="paw-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Perfil no encontrado</Text>
        <Text style={styles.errorBody}>
          Este código QR no corresponde a ninguna mascota activa.
        </Text>
        <Pressable onPress={() => router.replace('/')} style={styles.homeBtn}>
          <Text style={styles.homeBtnLabel}>Ir al inicio</Text>
        </Pressable>
      </View>
    );
  }

  const speciesLabel = SPECIES_LABELS[pet.species] ?? 'Animal';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.appLabel}>Huellitas</Text>
      </View>

      {pet.coverPhotoUrl != null ? (
        <Image
          source={{ uri: pet.coverPhotoUrl }}
          style={styles.photo}
          resizeMode="cover"
          testID="public-pet.photo"
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="paw" size={64} color={colors.accent} />
        </View>
      )}

      <View style={styles.nameRow}>
        <Text style={styles.petName}>{pet.name}</Text>
        {pet.isLost ? (
          <View style={styles.lostBadge}>
            <Text style={styles.lostBadgeLabel}>PERDIDO</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Tipo" value={speciesLabel} />
        {pet.breed != null && pet.breed.length > 0 ? (
          <InfoRow label="Raza" value={pet.breed} />
        ) : null}
        {pet.color != null && pet.color.length > 0 ? (
          <InfoRow label="Color" value={pet.color} />
        ) : null}
        {pet.age != null ? (
          <InfoRow label="Edad" value={`${pet.age} ${pet.age === 1 ? 'año' : 'años'}`} />
        ) : null}
      </View>

      {pet.isLost ? (
        <View style={styles.lostBanner}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={styles.lostBannerText}>
            Esta mascota está reportada como perdida. Si la encontraste, descarga Huellitas para
            contactar a su dueño.
          </Text>
        </View>
      ) : null}

      <Text style={styles.footer}>
        Perfil generado por Huellitas · App para dueños de mascotas en Colima
      </Text>
    </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  topBar: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  appLabel: { ...typography.bodyStrong, color: colors.accent },
  photo: {
    marginHorizontal: spacing.md,
    height: 260,
    borderRadius: radius.xl,
  },
  photoPlaceholder: {
    marginHorizontal: spacing.md,
    height: 260,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255, 138, 52, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
  },
  petName: { ...typography.title, color: colors.textPrimary, flex: 1 },
  lostBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  lostBadgeLabel: { ...typography.label, color: colors.white },
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
  lostBanner: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  lostBannerText: { ...typography.body, color: colors.dangerDark, flex: 1, lineHeight: 20 },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  errorTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  errorBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  homeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  homeBtnLabel: { ...typography.button, color: colors.white },
});
