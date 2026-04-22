import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  SPECIES_ICON_ASSETS,
  SPECIES_LABELS,
} from '../../../src/components/pets/speciesIconAssets';
import { colors, control, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import type { PetSpecies, PetSummary } from '../../../src/domain/pets';
import { usePets } from '../../../src/hooks/usePets';
import { MAX_PETS_PER_USER } from '../../../src/services/petsService';

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

export default function PetLimitScreen(): React.ReactElement {
  const router = useRouter();
  const { petsQuery, deletePetMutation } = usePets();
  const pets = petsQuery.data ?? [];
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deletePetMutation.mutateAsync(id);
        router.replace('/(app)/pets');
      } finally {
        setDeletingId(null);
      }
    },
    [deletePetMutation, router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          testID="petLimit.back"
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Nueva mascota</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.alertIconWrap}>
          <View style={styles.alertIconInner}>
            <Ionicons name="alert" size={32} color={colors.danger} />
          </View>
        </View>
        <Text style={styles.headline}>Límite alcanzado</Text>
        <Text style={styles.body}>
          Ya tienes <Text style={styles.bodyStrong}>{MAX_PETS_PER_USER} mascotas</Text> registradas.
          Elimina una para poder agregar una nueva.
        </Text>

        <View style={styles.card}>
          {pets
            .slice(0, MAX_PETS_PER_USER)
            .map((pet: PetSummary, idx: number, arr: PetSummary[]) => {
              const isLast = idx === arr.length - 1;
              const tint = speciesTint(pet.species);
              return (
                <View key={pet.id} style={[styles.row, !isLast && styles.rowDivider]}>
                  <View
                    style={[styles.avatar, { backgroundColor: tint.bg, borderColor: tint.border }]}
                  >
                    <Image
                      source={SPECIES_ICON_ASSETS[pet.species].selected}
                      style={styles.avatarImg}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petSpecies}>{SPECIES_LABELS[pet.species]}</Text>
                  </View>
                  <Pressable
                    testID={`petLimit.delete.${pet.id}`}
                    onPress={() => void onDelete(pet.id)}
                    disabled={deletePetMutation.isPending}
                    style={styles.deleteBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${pet.name}`}
                  >
                    {deletingId === pet.id ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Text style={styles.deleteLabel}>Eliminar</Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
        </View>

        <Pressable
          testID="petLimit.goPets"
          style={styles.secondaryCta}
          onPress={() => router.replace('/(app)/pets')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryCtaText}>Ir a mis mascotas</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  topTitle: { ...typography.heading, color: colors.textPrimary },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  alertIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  headline: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },
  bodyStrong: { color: colors.textPrimary, fontWeight: '700' },
  card: {
    width: '100%',
    maxWidth: 400,
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatarImg: { width: 48, height: 48 },
  rowText: { flex: 1, minWidth: 0 },
  petName: { ...typography.bodyStrong, color: colors.textPrimary },
  petSpecies: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { color: colors.danger, ...typography.caption, fontWeight: '700' },
  secondaryCta: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.border,
    borderRadius: radius.button,
    minHeight: control.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryCtaText: { color: colors.textPrimary, ...typography.button, fontWeight: '600' },
});
