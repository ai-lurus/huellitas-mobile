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
  'Avisos cuando alguien reporta una mascota cerca',
  'Recordatorios de tu búsqueda activa',
  'Puedes desactivarlas en cualquier momento',
];

export default function OnboardingStep3Screen(): React.JSX.Element {
  const router = useRouter();
  const setNotificationsGranted = useOnboardingStore((s) => s.setNotificationsGranted);
  const { request, openSettings } = useNotificationPermission();
  const { complete, submitting } = useOnboardingComplete();
  const [busy, setBusy] = useState(false);
  const [deniedInfo, setDeniedInfo] = useState(false);

  const skipStep = useCallback(() => {
    setNotificationsGranted(false);
    void complete('normal');
  }, [complete, setNotificationsGranted]);

  const skipAll = useCallback(() => {
    void complete('skipAll');
  }, [complete]);

  const onAllow = useCallback(async () => {
    setBusy(true);
    setDeniedInfo(false);
    try {
      const granted = await request();
      setNotificationsGranted(granted);
      if (granted) {
        void complete('normal');
      } else {
        setDeniedInfo(true);
      }
    } finally {
      setBusy(false);
    }
  }, [request, setNotificationsGranted, complete]);

  const onDoneAfterDeny = useCallback(() => {
    setNotificationsGranted(false);
    void complete('normal');
  }, [complete, setNotificationsGranted]);

  const loading = busy || submitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OnboardingChrome
        currentStep={3}
        showBack
        footer={
          <>
            {deniedInfo ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onDoneAfterDeny}
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
            ) : (
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
            )}
            {!deniedInfo ? (
              <Pressable
                accessibilityRole="button"
                onPress={skipStep}
                style={onboardingStyles.textLink}
              >
                <Text style={onboardingStyles.textLinkLabel}>Omitir este paso</Text>
              </Pressable>
            ) : null}
          </>
        }
        onBack={() => router.back()}
        onSkipAll={skipAll}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={48} color={colors.white} />
          </View>
          <Text style={onboardingStyles.title}>Activa las notificaciones</Text>
          <Text style={onboardingStyles.description}>
            Te avisamos cuando haya novedades importantes para ayudarte a encontrar o reportar
            mascotas.
          </Text>
          {RATIONALE.map((line) => (
            <View key={line} style={onboardingStyles.rationaleRow}>
              <Ionicons
                name="checkmark"
                size={20}
                color={colors.textSecondary}
                style={styles.checkIcon}
              />
              <Text style={onboardingStyles.rationaleText}>{line}</Text>
            </View>
          ))}
          {deniedInfo ? (
            <View style={styles.deniedBox} testID="onboarding.step3.denied">
              <Text style={styles.deniedTitle}>Notificaciones no disponibles</Text>
              <Text style={styles.deniedBody}>
                Sin permiso no podremos enviarte alertas. Puedes activarlas cuando quieras en los
                ajustes del dispositivo.
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
        </ScrollView>
      </OnboardingChrome>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
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
});
