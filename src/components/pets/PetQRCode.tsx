import React from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, radius, spacing, typography } from '../../design/tokens';

interface PetQRCodeProps {
  petId: string;
  petName: string;
  qrToken: string | undefined;
  isLoading: boolean;
  onRotate: () => void;
  isRotating: boolean;
}

const APP_SCHEME = 'huellitas';

function buildQrUrl(qrToken: string): string {
  return `${APP_SCHEME}://p/${qrToken}`;
}

export function PetQRCode({
  petName,
  qrToken,
  isLoading,
  onRotate,
  isRotating,
}: PetQRCodeProps): React.JSX.Element {
  const qrUrl = qrToken != null ? buildQrUrl(qrToken) : null;

  const handleShare = async (): Promise<void> => {
    if (!qrUrl) return;
    try {
      await Share.share({
        message: `Escanea el código QR para ver el perfil de ${petName} en Huellitas: ${qrUrl}`,
        url: qrUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const confirmRotate = (): void => {
    Alert.alert('Renovar código QR', 'El código QR anterior dejará de funcionar. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Renovar', style: 'destructive', onPress: onRotate },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Código QR de {petName}</Text>
      <Text style={styles.subtitle}>
        Ponlo en la placa o collar. Al escanearlo se muestra el perfil público de tu mascota.
      </Text>

      <View style={styles.qrBox}>
        {isLoading || qrUrl == null ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : (
          <QRCode
            value={qrUrl}
            size={200}
            color={colors.textPrimary}
            backgroundColor={colors.white}
          />
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => void handleShare()}
          disabled={qrUrl == null}
          style={[styles.btn, styles.btnPrimary, qrUrl == null && styles.btnDisabled]}
          testID="qr.share"
        >
          <Text style={styles.btnLabel}>Compartir</Text>
        </Pressable>
        <Pressable
          onPress={confirmRotate}
          disabled={isRotating || qrUrl == null}
          style={[styles.btn, styles.btnSecondary, isRotating && styles.btnDisabled]}
          testID="qr.rotate"
        >
          {isRotating ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.btnSecondaryLabel}>Renovar código</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  qrBox: {
    width: 240,
    height: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  btn: {
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { ...typography.button, color: colors.white },
  btnSecondaryLabel: { ...typography.button, color: colors.textSecondary },
});
