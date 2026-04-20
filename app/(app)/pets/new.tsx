import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PetForm, type PetFormSubmitPayload } from '../../../src/components/pets/PetForm';
import { colors, spacing, typography } from '../../../src/design/tokens';
import { usePets } from '../../../src/hooks/usePets';
import { MAX_PETS_PER_USER } from '../../../src/services/petsService';

function statusFromUnknown(err: unknown): number | null {
  const e = err as { response?: { status?: unknown }; status?: unknown; statusCode?: unknown };
  const rs = e?.response?.status;
  if (typeof rs === 'number') return rs;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.statusCode === 'number') return e.statusCode;
  return null;
}

export default function NewPetScreen(): React.ReactElement {
  const router = useRouter();
  const { createPetMutation, petsQuery } = usePets();

  useEffect(() => {
    if (!petsQuery.isFetched) return;
    if ((petsQuery.data?.length ?? 0) >= MAX_PETS_PER_USER) {
      router.replace('/(app)/pets/limit');
    }
  }, [petsQuery.isFetched, petsQuery.data, router]);

  const submitError = useMemo(() => {
    const err = createPetMutation.error;
    if (!err) return null;
    const status = statusFromUnknown(err);
    if (status === 422) return 'Solo puedes tener un máximo de 3 mascotas';
    if (err instanceof Error && err.message) return err.message;
    return 'No se pudo guardar tu mascota. Intenta de nuevo.';
  }, [createPetMutation.error]);

  const handleSubmit = async (data: PetFormSubmitPayload): Promise<void> => {
    try {
      await createPetMutation.mutateAsync(data);
      router.replace('/(app)/pets');
    } catch {
      // El error se refleja en `createPetMutation.error` (se muestra como mensaje amigable).
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
        <Text style={styles.title}>Nueva mascota</Text>
        <View style={styles.backBtn} />
      </View>

      <PetForm
        isSubmitting={createPetMutation.isPending}
        submitError={submitError}
        onSubmit={handleSubmit}
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
