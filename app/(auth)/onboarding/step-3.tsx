import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingChrome } from '../../../src/components/onboarding/OnboardingChrome';
import { onboardingStyles } from '../../../src/components/onboarding/onboardingStyles';
import { colors, control, radius, spacing, typography } from '../../../src/design/tokens';
import { useNotificationPermission } from '../../../src/hooks/useNotificationPermission';
import { useOnboardingComplete } from '../../../src/hooks/useOnboardingComplete';
import { useOnboardingStore } from '../../../src/stores/onboardingStore';

const RATIONALE: string[] = [
  'Alertas de inicio de sesión sospechoso',
  'Recordatorios de actualizar contraseñas',
  'Puedes ajustarlas cuando quieras',
];

export default function OnboardingStep3Screen(): React.JSX.Element {
  const router = useRouter();
  const setNotificationsGranted = useOnboardingStore((s) => s.setNotificationsGranted);
  const { request, openSettings } = useNotificationPermission();
  const { complete, submitError, submitting, clearError } = useOnboardingComplete();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'prompt' | 'denied'>('prompt');

  const runComplete = useCallback(async () => {
    clearError();
    await complete('normal');
  }, [complete, clearError]);

  const skipAll = useCallback(() => {
    void complete('skipAll');
  }, [complete]);

  const skipStep = useCallback(() => {
    setNotificationsGranted(false);
    void runComplete();
  }, [setNotificationsGranted, runComplete]);

  const onAllow = useCallback(async () => {
    setBusy(true);
    clearError();
    try {
      const granted = await request();
      setNotificationsGranted(granted);
      if (granted) {
        await complete('normal');
      } else {
        setPhase('denied');
      }
    } finally {
      setBusy(false);
    }
  }, [request, setNotificationsGranted, complete, clearError]);

  const onFinish = useCallback(() => {
    void runComplete();
  }, [runComplete]);

  const loading = busy || submitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OnboardingChrome
        currentStep={3}
        showBack
        footer={
          <>
            {phase === 'prompt' ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onAllow}
                style={[
                  onboardingStyles.primaryButton,
                  loading && onboardingStyles.primaryButtonDisabled,
                ]}
                testID="onboarding.next"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={onboardingStyles.primaryButtonLabel}>Permitir notificaciones</Text>
                    <Ionicons
                      name="notifications-outline"
                      size={control.icon}
                      color={colors.white}
                    />
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onFinish}
                style={[
                  onboardingStyles.primaryButton,
                  loading && onboardingStyles.primaryButtonDisabled,
                ]}
                testID="onboarding.done"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={onboardingStyles.primaryButtonLabel}>Finalizar</Text>
                )}
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={skipStep}
              style={onboardingStyles.textLink}
            >
              <Text style={onboardingStyles.textLinkLabel}>Omitir este paso</Text>
            </Pressable>
          </>
        }
        onBack={() => router.back()}
        onSkipAll={skipAll}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={48} color={colors.white} />
          </View>
          <Text style={onboardingStyles.title}>No te pierdas nada importante</Text>
          <Text style={onboardingStyles.description}>
            Activa las notificaciones para recibir alertas de búsqueda y actualizaciones de tu
            cuenta al instante.
          </Text>
          {RATIONALE.map((line) => (
            <View key={line} style={onboardingStyles.rationaleRow}>
              <Ionicons name="checkmark" size={20} color={colors.black} style={styles.checkIcon} />
              <Text style={onboardingStyles.rationaleText}>{line}</Text>
            </View>
          ))}
          {phase === 'denied' ? (
            <View style={styles.deniedBox} testID="onboarding.step3.denied">
              <Text style={styles.deniedTitle}>Notificaciones desactivadas</Text>
              <Text style={styles.deniedBody}>
                Puedes activarlas más tarde en los ajustes del sistema para no perderte alertas
                importantes.
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={openSettings}
                style={onboardingStyles.textLink}
              >
                <Text style={onboardingStyles.textLinkLabel}>Abrir ajustes</Text>
              </Pressable>
            </View>
          ) : null}
          {submitError ? (
            <Text style={styles.error} testID="onboarding.submitError">
              {submitError}
            </Text>
          ) : null}
        </ScrollView>
      </OnboardingChrome>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  checkIcon: {
    marginTop: 3,
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  deniedBox: {
    width: '100%',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deniedTitle: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  deniedBody: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    ...typography.body,
  },
  error: {
    marginTop: spacing.md,
    color: colors.danger,
    ...typography.caption,
    textAlign: 'center',
  },
});
