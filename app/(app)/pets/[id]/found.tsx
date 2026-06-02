import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, spacing, typography } from '../../../../src/design/tokens';
import { usePet, useMarkFoundMutation } from '../../../../src/hooks/usePets';

export default function MarkFoundScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petId = id ?? '';

  const petQuery = usePet(petId);
  const markFoundMutation = useMarkFoundMutation(petId);
  const pet = petQuery.data;

  const handleConfirm = useCallback(async (): Promise<void> => {
    try {
      await markFoundMutation.mutateAsync();
      router.replace(`/(app)/pets/${petId}`);
    } catch {
      // error handled via markFoundMutation.error below
    }
  }, [markFoundMutation, petId, router]);

  if (petQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const petName = pet?.name?.trim() || 'tu mascota';

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
        <Text style={styles.headerTitle}>Marcar como encontrado</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>

        <Text style={styles.title}>¿Encontraste a {petName}?</Text>
        <Text style={styles.description}>
          El reporte de pérdida se cerrará y {petName} volverá a aparecer como en casa.
        </Text>

        {markFoundMutation.isError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>No se pudo actualizar. Intentá de nuevo.</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void handleConfirm()}
          style={[
            styles.confirmBtn,
            markFoundMutation.isPending ? styles.confirmBtnDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Confirmar que fue encontrado"
          accessibilityState={{ disabled: markFoundMutation.isPending }}
          disabled={markFoundMutation.isPending}
        >
          {markFoundMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={colors.white} />
              <Text style={styles.confirmBtnText}>Sí, lo encontré</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.cancelBtn}
          accessibilityRole="button"
          disabled={markFoundMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  headerTitle: { color: colors.textPrimary, ...typography.heading },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: { marginBottom: spacing.sm },
  title: { color: colors.textPrimary, ...typography.heading, textAlign: 'center' },
  description: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#F2B7B7',
    alignSelf: 'stretch',
  },
  errorText: { color: colors.danger, ...typography.body, flex: 1 },
  confirmBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: colors.white, ...typography.button },
  cancelBtn: {
    height: 54,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cancelBtnText: { color: colors.textSecondary, ...typography.button },
});
