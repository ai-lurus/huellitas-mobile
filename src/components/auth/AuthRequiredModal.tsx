import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

export interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ visible, onClose }: AuthRequiredModalProps): React.JSX.Element {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="authRequiredModal.backdrop" />
      <View style={styles.sheet}>
        <Text style={styles.title}>Inicia sesión para continuar</Text>
        <Text style={styles.subtitle}>Esto solo está disponible si inicias sesión.</Text>

        <Pressable
          accessibilityRole="button"
          testID="authRequiredModal.signIn"
          onPress={() => {
            onClose();
            router.push('/(auth)/sign-in');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          testID="authRequiredModal.signUp"
          onPress={() => {
            onClose();
            router.push('/(auth)/sign-up');
          }}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Crear cuenta</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
  },
  title: {
    color: colors.textPrimary,
    ...typography.heading,
  },
  subtitle: {
    color: colors.textSecondary,
    ...typography.body,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    ...typography.button,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    ...typography.bodyStrong,
  },
});
