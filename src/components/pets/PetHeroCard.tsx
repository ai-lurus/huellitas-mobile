import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import type { PetSummary } from '../../domain/pets';
import { buildMockVaccines, computeVaccinesSummary } from '../../domain/petCarnet';
import { computeAgeLabel, formatShortDate } from '../../utils/date.utils';
import { SPECIES_ICON_ASSETS, SPECIES_LABELS } from './speciesIconAssets';
import { PetPhoto } from '../common/PetPhoto';

import LOST_BADGE from '../../../assets/badges/badge-perdido.png';
import FOUND_BADGE from '../../../assets/badges/badge-encontrado.png';

export interface PetHeroCardProps {
  pet: PetSummary;
  onPress: () => void;
  onOpenCarnet: () => void;
  onOpenRutina: () => void;
}

export function PetHeroCard({
  pet,
  onPress,
  onOpenCarnet,
  onOpenRutina,
}: PetHeroCardProps): React.ReactElement {
  const speciesLabel = SPECIES_LABELS[pet.species];
  const photo = pet.photoUrl?.trim();
  const status = pet.status ?? (pet.isLost ? 'lost' : undefined);
  const badgeSource = status === 'lost' ? LOST_BADGE : status === 'found' ? FOUND_BADGE : null;

  const age =
    computeAgeLabel(pet.birthDate) ?? (typeof pet.age === 'number' ? `${pet.age} años` : null);
  const breedAge = [pet.breed?.trim(), age].filter(Boolean).join(' · ');

  // Vacunas/próxima dosis: mock semi-vivo determinístico (mismo criterio que en el Perfil).
  const vaccinesSummary = useMemo(
    () => computeVaccinesSummary(buildMockVaccines(pet.id)),
    [pet.id],
  );
  const weightLabel = typeof pet.weightKg === 'number' ? `${pet.weightKg} kg` : '—';
  const nextDoseLabel = vaccinesSummary.nextDoseAt
    ? formatShortDate(vaccinesSummary.nextDoseAt)
    : '—';

  return (
    <View style={styles.card} testID={`petCard.${pet.id}`}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`${pet.name}, ${speciesLabel}`}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarOuter}>
            <PetPhoto
              uri={photo}
              fallback={SPECIES_ICON_ASSETS[pet.species].selected}
              style={styles.avatarInner}
              resizeMode="cover"
            />
          </View>
          <View style={styles.textCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {pet.name}
              </Text>
              {badgeSource ? (
                <Image
                  source={badgeSource}
                  style={styles.statusBadge}
                  resizeMode="contain"
                  accessibilityLabel={status === 'lost' ? 'Perdido' : 'Encontrado'}
                />
              ) : null}
            </View>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{speciesLabel}</Text>
              </View>
              {breedAge ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {breedAge}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text
              style={[
                styles.statValue,
                vaccinesSummary.status === 'overdue' ? styles.statValueAlert : styles.statValueOk,
              ]}
            >
              {vaccinesSummary.status === 'overdue' ? 'Vencida' : 'Al día'}
            </Text>
            <Text style={styles.statLabel}>Vacunas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{weightLabel}</Text>
            <Text style={styles.statLabel}>Peso</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{nextDoseLabel}</Text>
            <Text style={styles.statLabel}>Próx. dosis</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable
          testID={`petCard.${pet.id}.carnet`}
          onPress={onOpenCarnet}
          style={styles.actionBtn}
          accessibilityRole="button"
        >
          <Ionicons name="medkit-outline" size={16} color={colors.primary} />
          <Text style={styles.actionBtnText}>Bitácora de vacunas</Text>
        </Pressable>
        <Pressable
          testID={`petCard.${pet.id}.rutina`}
          onPress={onOpenRutina}
          style={styles.actionBtn}
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.actionBtnText}>Calendario</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.md,
  },
  body: { gap: spacing.md },
  pressed: { opacity: 0.92 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarOuter: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
  },
  avatarInner: { width: '100%', height: '100%' },
  textCol: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.textPrimary, ...typography.title, fontSize: 20, flexShrink: 1 },
  statusBadge: { height: 18, width: 88, marginLeft: spacing.xs },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.infoBackground,
  },
  chipText: { color: colors.primary, ...typography.caption, fontWeight: '700' },
  meta: { color: colors.textSecondary, ...typography.caption, flexShrink: 1 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValue: { color: colors.textPrimary, ...typography.bodyStrong },
  statValueOk: { color: colors.success },
  statValueAlert: { color: colors.dangerDark },
  statLabel: { color: colors.textMuted, ...typography.caption, marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  actionBtnText: { color: colors.primary, ...typography.caption, fontWeight: '700' },
});
