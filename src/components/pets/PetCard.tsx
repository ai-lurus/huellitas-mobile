import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import type { PetSpecies, PetSummary } from '../../domain/pets';
import { SPECIES_ICON_ASSETS, SPECIES_LABELS } from './speciesIconAssets';

import LOST_BADGE from '../../../assets/badges/badge-perdido.png';
import FOUND_BADGE from '../../../assets/badges/badge-encontrado.png';

export interface PetCardProps {
  pet: PetSummary;
  onPress: () => void;
}

function badgeTint(species: PetSpecies): { bg: string; text: string } {
  switch (species) {
    case 'dog':
      return { bg: '#FFE6A8', text: '#7A4B00' };
    case 'cat':
      return { bg: '#DCD7FF', text: '#3D2BAA' };
    case 'bird':
      return { bg: '#D9F5E7', text: '#0F7A3A' };
    case 'rabbit':
      return { bg: '#FFD3EA', text: '#9D174D' };
    default:
      return { bg: '#DBEAFE', text: '#1D4ED8' };
  }
}

function borderTint(species: PetSpecies): string {
  switch (species) {
    case 'dog':
      return '#F59E0B';
    case 'cat':
      return '#6D28D9';
    case 'bird':
      return '#16A34A';
    case 'rabbit':
      return '#DB2777';
    default:
      return '#2563EB';
  }
}

export function PetCard({ pet, onPress }: PetCardProps): React.ReactElement {
  const speciesLabel = SPECIES_LABELS[pet.species];
  const tint = badgeTint(pet.species);
  const borderColor = borderTint(pet.species);
  const photo = pet.photoUrl?.trim();
  const status = pet.status ?? (pet.isLost ? 'lost' : undefined);
  const badgeSource = status === 'lost' ? LOST_BADGE : status === 'found' ? FOUND_BADGE : null;

  return (
    <Pressable
      testID={`petCard.${pet.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${speciesLabel}`}
    >
      <View style={styles.row}>
        <View style={[styles.avatarOuter, { backgroundColor: tint.bg, borderColor }]}>
          <View style={styles.avatarInner}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            ) : (
              <Image
                source={SPECIES_ICON_ASSETS[pet.species].selected}
                style={styles.fallbackIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            )}
          </View>
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
            <View style={[styles.chip, { backgroundColor: tint.bg }]}>
              <Text style={[styles.chipText, { color: tint.text }]}>{speciesLabel}</Text>
            </View>
            {pet.breed?.trim() ? (
              <Text style={styles.meta} numberOfLines={1}>
                {pet.breed.trim()}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PetCardSkeleton(): React.ReactElement {
  return (
    <View style={styles.card} accessibilityLabel="Cargando mascota">
      <View style={styles.row}>
        <View style={[styles.avatarOuter, styles.skeletonAvatar]} />
        <View style={styles.textCol}>
          <View style={styles.skeletonLineRow}>
            <View style={[styles.skeletonLine, { width: '55%' }]} />
            <View style={[styles.skeletonPill, { width: 72 }]} />
          </View>
          <View style={[styles.skeletonLine, { width: '35%', marginTop: spacing.xs }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarOuter: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  fallbackIcon: { width: 56, height: 56 },
  textCol: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { color: colors.textPrimary, ...typography.bodyStrong, fontSize: 16, flexShrink: 1 },
  statusBadge: { height: 18, width: 88, marginLeft: spacing.xs },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full },
  chipText: { ...typography.caption, fontWeight: '700' },
  meta: { color: colors.textSecondary, ...typography.caption, flexShrink: 1 },

  skeleton: { backgroundColor: '#ECEFF5' },
  skeletonAvatar: {
    backgroundColor: '#ECEFF5',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  skeletonLineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ECEFF5',
  },
  skeletonPill: {
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECEFF5',
  },
});
