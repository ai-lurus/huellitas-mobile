import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingChrome } from '../../../src/components/onboarding/OnboardingChrome';
import { onboardingStyles } from '../../../src/components/onboarding/onboardingStyles';
import { colors, control, radius, spacing, typography } from '../../../src/design/tokens';
import { useLocationPermission } from '../../../src/hooks/useLocationPermission';
import { useOnboardingComplete } from '../../../src/hooks/useOnboardingComplete';
import { useOnboardingStore } from '../../../src/stores/onboardingStore';

const RATIONALE: string[] = [
  'Mascotas perdidas en tu ciudad',
  'Alertas de búsqueda por zona',
  'Solo se usa cuando la app está abierta',
];

export default function OnboardingStep2Screen(): React.JSX.Element {
  const router = useRouter();
  const setLocationGranted = useOnboardingStore((s) => s.setLocationGranted);
  const { request, openSettings } = useLocationPermission();
  const { complete, submitting } = useOnboardingComplete();
  const [busy, setBusy] = useState(false);
  const [deniedInfo, setDeniedInfo] = useState(false);

  const goNext = useCallback(() => {
    router.push('/(auth)/onboarding/step-3' as Href);
  }, [router]);

  const skipStep = useCallback(() => {
    setLocationGranted(false);
    goNext();
  }, [goNext, setLocationGranted]);

  const skipAll = useCallback(() => {
    void complete('skipAll');
  }, [complete]);

  const onAllow = useCallback(async () => {
    setBusy(true);
    setDeniedInfo(false);
    try {
      const granted = await request();
      setLocationGranted(granted);
      if (granted) {
        goNext();
      } else {
        setDeniedInfo(true);
      }
    } finally {
      setBusy(false);
    }
  }, [request, setLocationGranted, goNext]);

  const onContinueAfterDeny = useCallback(() => {
    setLocationGranted(false);
    goNext();
  }, [goNext, setLocationGranted]);

  const loading = busy || submitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OnboardingChrome
        currentStep={2}
        showBack
        footer={
          <>
            {deniedInfo ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onContinueAfterDeny}
                style={[
                  onboardingStyles.primaryButton,
                  loading && onboardingStyles.primaryButtonDisabled,
                ]}
                testID="onboarding.next"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={onboardingStyles.primaryButtonLabel}>Siguiente</Text>
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
                    <Text style={onboardingStyles.primaryButtonLabel}>Permitir ubicación</Text>
                    <Ionicons name="location-outline" size={control.icon} color={colors.white} />
                  </>
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
            <Ionicons name="location" size={48} color={colors.white} />
          </View>
          <Text style={onboardingStyles.title}>Comparte tu ubicación</Text>
          <Text style={onboardingStyles.description}>
            Usamos tu ubicación para mostrarte alertas relevantes a tu zona.
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
            <View style={styles.deniedBox} testID="onboarding.step2.denied">
              <Text style={styles.deniedTitle}>Ubicación no disponible</Text>
              <Text style={styles.deniedBody}>
                Sin permiso no podremos filtrar alertas por zona. Puedes activarlo cuando quieras en
                los ajustes del dispositivo.
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
