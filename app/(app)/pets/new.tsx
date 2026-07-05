import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { PetForm, type PetFormSubmitPayload } from '../../../src/components/pets/PetForm';
import { colors } from '../../../src/design/tokens';
import { usePets } from '../../../src/hooks/usePets';
import { MAX_PETS_PER_USER } from '../../../src/services/petsService';

/** El backend distingue "límite alcanzado" de otros 422 (p. ej. validación) vía `code`. */
function isPetLimitError(err: unknown): boolean {
  const e = err as { response?: { status?: unknown; data?: { code?: unknown } } };
  return e?.response?.status === 422 && e?.response?.data?.code === 'LIMIT_EXCEEDED';
}

/** Mensaje de error real del backend, si vino uno (útil para 422 que no son de límite). */
function serverErrorMessage(err: unknown): string | null {
  const e = err as { response?: { data?: { error?: unknown } } };
  const msg = e?.response?.data?.error;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
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
    if (isPetLimitError(err)) return 'Solo puedes tener un máximo de 3 mascotas';
    const serverMessage = serverErrorMessage(err);
    if (serverMessage) return serverMessage;
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
    <View style={styles.safe}>
      <ScreenHeader title="Nueva mascota" onBack={() => router.back()} testID="newPet" />

      <PetForm
        isSubmitting={createPetMutation.isPending}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
});
