import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PetForm, type PetFormSubmitPayload } from '../../../../src/components/pets/PetForm';
import { Skeleton } from '../../../../src/components/skeleton/Skeleton';
import { colors, radius, spacing, typography } from '../../../../src/design/tokens';
import { usePet, useUpdatePetMutation } from '../../../../src/hooks/usePets';

export default function EditPetScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = id ?? '';

  const petQuery = usePet(petId);
  const updateMutation = useUpdatePetMutation(petId);

  const defaultValues = useMemo(() => {
    const pet = petQuery.data;
    if (!pet) return undefined;
    return {
      name: pet.name ?? '',
      species: pet.species ?? 'dog',
      sex: pet.sex ?? 'unknown',
      breed: pet.breed ?? '',
      color: pet.color ?? '',
      birthDate: pet.birthDate ? new Date(pet.birthDate) : null,
      weightKg: typeof pet.weightKg === 'number' ? String(pet.weightKg) : '',
      hasMicrochip: pet.hasMicrochip ?? false,
      notes: pet.notes ?? '',
      photos: (pet.photos ?? []).slice(0, 5),
    };
  }, [petQuery.data]);

  const submitError = useMemo(() => {
    const err = updateMutation.error;
    if (!err) return null;
    if (err instanceof Error && err.message) return err.message;
    return 'No se pudo actualizar tu mascota. Intenta de nuevo.';
  }, [updateMutation.error]);

  const onSubmit = async (data: PetFormSubmitPayload): Promise<void> => {
    try {
      await updateMutation.mutateAsync(data);
      router.replace(`/(app)/pets/${petId}`);
    } catch {
      // El error se refleja en `updateMutation.error`.
    }
  };

  if (petQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Editar mascota</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonPhotosRow}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={styles.skeletonPhoto} borderRadius={radius.lg} />
            ))}
          </View>
          <Skeleton style={styles.skeletonLabel} borderRadius={4} />
          <Skeleton style={styles.skeletonInput} borderRadius={radius.lg} />
          <Skeleton style={styles.skeletonLabel} borderRadius={4} />
          <View style={styles.skeletonSpeciesRow}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={styles.skeletonSpeciesChip} borderRadius={radius.lg} />
            ))}
          </View>
          <View style={styles.skeletonRow}>
            <Skeleton
              style={[styles.skeletonInput, styles.skeletonHalf]}
              borderRadius={radius.lg}
            />
            <Skeleton
              style={[styles.skeletonInput, styles.skeletonHalf]}
              borderRadius={radius.lg}
            />
          </View>
          <Skeleton style={styles.skeletonLabel} borderRadius={4} />
          <Skeleton style={styles.skeletonInput} borderRadius={radius.lg} />
          <Skeleton style={styles.skeletonTextarea} borderRadius={radius.lg} />
          <Skeleton style={styles.skeletonButton} borderRadius={radius.button} />
        </View>
      </SafeAreaView>
    );
  }

  if (!petQuery.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Editar mascota</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loading}>
          <Text style={styles.errorText}>No se pudo cargar la mascota.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Editar mascota</Text>
        <View style={styles.backBtn} />
      </View>

      <PetForm
        key={petId}
        mode="edit"
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
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
  title: { color: colors.textPrimary, ...typography.heading },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorText: { color: colors.textSecondary, ...typography.body, textAlign: 'center' },

  skeletonContent: { padding: spacing.lg, gap: spacing.sm },
  skeletonPhotosRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  skeletonPhoto: { width: 64, height: 64 },
  skeletonLabel: { width: 120, height: 14 },
  skeletonInput: { height: 48, width: '100%' },
  skeletonHalf: { flex: 1, width: undefined },
  skeletonSpeciesRow: { flexDirection: 'row', gap: spacing.sm },
  skeletonSpeciesChip: { width: 64, height: 64 },
  skeletonRow: { flexDirection: 'row', gap: spacing.sm },
  skeletonTextarea: { height: 120, width: '100%' },
  skeletonButton: { height: 54, width: '100%', marginTop: spacing.md, borderRadius: radius.button },
});
