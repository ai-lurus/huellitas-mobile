import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PetQRCode } from '../../../../src/components/pets/PetQRCode';
import { colors, spacing } from '../../../../src/design/tokens';
import { usePetQrToken, useRotateQrToken } from '../../../../src/hooks/usePetQr';
import { usePet } from '../../../../src/hooks/usePets';

export default function PetQrScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = id ?? '';
  const router = useRouter();

  const petQuery = usePet(petId);
  const qrQuery = usePetQrToken(petId);
  const rotateMutation = useRotateQrToken(petId);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="qr.back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <PetQRCode
        petId={petId}
        petName={petQuery.data?.name ?? 'tu mascota'}
        qrToken={qrQuery.data}
        isLoading={qrQuery.isLoading}
        isError={qrQuery.isError}
        onRetry={() => void qrQuery.refetch()}
        onRotate={() => rotateMutation.mutate()}
        isRotating={rotateMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
