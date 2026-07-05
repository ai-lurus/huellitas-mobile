import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';
import { PetQRCode } from '../../../../src/components/pets/PetQRCode';
import { colors } from '../../../../src/design/tokens';
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
      <ScreenHeader title="Código QR" onBack={() => router.back()} testID="qr" />

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
});
