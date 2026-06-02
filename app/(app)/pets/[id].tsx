import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PetDetail } from '../../../src/components/pets/PetDetail';
import { PetCardSkeleton } from '../../../src/components/pets/PetCard';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { usePet, usePets } from '../../../src/hooks/usePets';

export default function PetDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const petId = id ?? '';

  const petQuery = usePet(petId);
  const { deletePetMutation } = usePets();

  const pet = petQuery.data;

  const deleteCopy = useMemo(() => {
    const name = pet?.name?.trim() || 'esta mascota';
    return {
      title: `¿Eliminar tarjeta de ${name}?`,
      message:
        'Esta acción es permanente. Se borrará toda la información y fotos.\n\nNo se puede deshacer.',
    };
  }, [pet?.name]);

  const confirmDelete = useCallback(() => {
    Alert.alert(deleteCopy.title, deleteCopy.message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, eliminar tarjeta',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePetMutation.mutateAsync(petId);
              router.replace('/(app)/pets');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la mascota. Intentá de nuevo.');
            }
          })();
        },
      },
    ]);
  }, [deleteCopy.message, deleteCopy.title, deletePetMutation, petId, router]);

  if (petQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.skeletonWrap}>
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(i) => String(i)}
            contentContainerStyle={styles.skeletonList}
            renderItem={() => <PetCardSkeleton />}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorWrap}>
          <Ionicons name="paw-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>No encontramos esta mascota</Text>
          <Text style={styles.errorSubtitle}>
            Es posible que haya sido eliminada o que haya un problema de conexión.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
          >
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PetDetail
        pet={pet}
        onBack={() => router.back()}
        onEdit={() => router.push(`/(app)/pets/${petId}/edit`)}
        onReportLost={() => router.push(`/(app)/pets/${petId}/report-lost`)}
        onMarkFound={() => router.push(`/(app)/pets/${petId}/found`)}
        onDelete={confirmDelete}
        isDeleting={deletePetMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  skeletonWrap: { flex: 1, backgroundColor: colors.backgroundApp },
  skeletonList: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: { color: colors.textPrimary, ...typography.heading, textAlign: 'center' },
  errorSubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  backBtnText: { color: colors.white, ...typography.bodyStrong },
});
