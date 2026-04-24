import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PetForm, type PetFormSubmitPayload } from '../../../../src/components/pets/PetForm';
import { colors, spacing, typography } from '../../../../src/design/tokens';
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
      age: typeof pet.age === 'number' ? String(pet.age) : '',
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
});
