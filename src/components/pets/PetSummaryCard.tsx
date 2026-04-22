import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, control, radius, shadows, spacing, typography } from '../../design/tokens';
import type { PetSpecies, PetSummary } from '../../domain/pets';
import { SPECIES_ICON_ASSETS, SPECIES_LABELS } from './speciesIconAssets';

export interface PetSummaryCardProps {
  pet: PetSummary;
  onPress: () => void;
}

function speciesTint(species: PetSpecies): { bg: string; border: string } {
  switch (species) {
    case 'dog':
      return { bg: '#FFF4D4', border: '#E2B453' };
    case 'cat':
      return { bg: '#EDE7FF', border: '#7A5AF8' };
    case 'bird':
      return { bg: '#E3F6ED', border: '#16A34A' };
    case 'rabbit':
      return { bg: '#FFE8F4', border: '#DB2777' };
    default:
      return { bg: '#E8F2FF', border: '#2563EB' };
  }
}

export function PetSummaryCard({ pet, onPress }: PetSummaryCardProps): React.ReactElement {
  const speciesLabel = SPECIES_LABELS[pet.species];
  const breedLine = [speciesLabel, pet.breed?.trim() || null].filter(Boolean).join(' · ');
  const tint = speciesTint(pet.species);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${pet.name}, ${breedLine}`}
    >
      {pet.isLost ? (
        <View style={styles.lostBadge} accessibilityLabel="Perdido">
          <View style={styles.lostDot} />
          <Text style={styles.lostText}>PERDIDO</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tint.bg, borderColor: tint.border }]}>
          <Image
            source={SPECIES_ICON_ASSETS[pet.species].selected}
            style={styles.iconImg}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.meta}>{breedLine}</Text>
        </View>
        <Ionicons name="chevron-forward" size={control.iconLg} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
    overflow: 'visible',
  },
  cardPressed: { opacity: 0.92 },
  lostBadge: {
    position: 'absolute',
    top: -8,
    left: spacing.sm,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navActive,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  lostDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  lostText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  iconImg: { width: 56, height: 56 },
  textCol: { flex: 1, minWidth: 0 },
  name: { color: colors.textPrimary, ...typography.bodyStrong, fontSize: 16 },
  meta: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
});
