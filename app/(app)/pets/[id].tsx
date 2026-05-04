import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PetDetail } from '../../../src/components/pets/PetDetail';
import { PetCardSkeleton } from '../../../src/components/pets/PetCard';
import { colors, spacing } from '../../../src/design/tokens';
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
          void deletePetMutation.mutateAsync(petId).then(() => {
            router.replace('/(app)/pets');
          });
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
        <View style={styles.notFound} />
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  skeletonWrap: { flex: 1, backgroundColor: colors.backgroundApp },
  skeletonList: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  notFound: { flex: 1, backgroundColor: colors.backgroundApp },
});
