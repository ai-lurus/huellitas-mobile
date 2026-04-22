import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { OnboardingChrome } from '../../../src/components/onboarding/OnboardingChrome';
import { onboardingStyles } from '../../../src/components/onboarding/onboardingStyles';
import { colors, control, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { useOnboardingComplete } from '../../../src/hooks/useOnboardingComplete';
import { useAuthStore } from '../../../src/stores/authStore';
import { useOnboardingStore } from '../../../src/stores/onboardingStore';

export default function OnboardingStep1Screen(): React.JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const photo = useOnboardingStore((s) => s.photo);
  const setPhoto = useOnboardingStore((s) => s.setPhoto);
  const { complete, submitting } = useOnboardingComplete();
  const [pickerDenied, setPickerDenied] = useState(false);

  const displayName = user?.name ?? 'Usuario';
  const avatarUri = photo ?? user?.image ?? null;

  const pickImage = useCallback(async () => {
    setPickerDenied(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPickerDenied(true);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, [setPhoto]);

  const goNext = useCallback(() => {
    router.push('/(auth)/onboarding/step-2' as Href);
  }, [router]);

  const skipStep = useCallback(() => {
    goNext();
  }, [goNext]);

  const skipAll = useCallback(() => {
    void complete('skipAll');
  }, [complete]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <OnboardingChrome
        currentStep={1}
        footer={
          <>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={goNext}
              style={[
                onboardingStyles.primaryButton,
                submitting && onboardingStyles.primaryButtonDisabled,
              ]}
              testID="onboarding.next"
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={onboardingStyles.primaryButtonLabel}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={control.icon} color={colors.white} />
                </>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={skipStep}
              style={onboardingStyles.textLink}
            >
              <Text style={onboardingStyles.textLinkLabel}>Omitir este paso</Text>
            </Pressable>
          </>
        }
        onSkipAll={skipAll}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerTop}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image
                    accessibilityLabel="Foto de perfil"
                    source={{ uri: avatarUri }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={56} color={colors.white} />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={pickImage}
                  style={styles.cameraBadge}
                  testID="onboarding.step1.camera"
                >
                  <Ionicons name="camera" size={18} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <Text style={onboardingStyles.title}>Elige una foto para tu perfil</Text>
            <Text style={onboardingStyles.description}>
              Una foto ayuda a que otros te reconozcan fácilmente en la plataforma.
            </Text>

            <View style={styles.nameCard} testID="onboarding.step1.name">
              <View style={styles.nameIconBox}>
                <Ionicons name="person-outline" size={22} color={colors.iconMuted} />
              </View>
              <Text style={styles.nameText}>{displayName}</Text>
              <View style={styles.onlineDot} />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={pickImage}
              style={styles.uploadBox}
              testID="onboarding.step1.upload"
            >
              <Ionicons name="arrow-up-circle-outline" size={28} color={colors.primary} />
              <View style={styles.uploadTextWrap}>
                <Text style={styles.uploadTitle}>Subir foto</Text>
                <Text style={styles.uploadHint}>JPG, PNG · Máx. 5 MB</Text>
              </View>
              <View style={styles.chooseChip}>
                <Text style={styles.chooseChipLabel}>Elegir</Text>
              </View>
            </Pressable>

            {pickerDenied ? (
              <View style={styles.deniedBox}>
                <Text style={styles.deniedText}>
                  Necesitamos acceso a tu galería para elegir una foto. Puedes activarlo en Ajustes.
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void ImagePicker.requestMediaLibraryPermissionsAsync()}
                  style={onboardingStyles.textLink}
                >
                  <Text style={onboardingStyles.textLinkLabel}>Reintentar permiso</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openSettings()}
                  style={onboardingStyles.textLink}
                >
                  <Text style={onboardingStyles.textLinkLabel}>Abrir ajustes</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  centerTop: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  avatarOuter: {
    marginBottom: spacing.lg,
    padding: spacing.xxs,
    borderRadius: 72,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.surface,
    backgroundColor: colors.background,
    ...shadows.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  nameIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  nameText: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  uploadTextWrap: {
    flex: 1,
  },
  uploadTitle: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  uploadHint: {
    color: colors.textSecondary,
    ...typography.caption,
    marginTop: 2,
  },
  chooseChip: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  chooseChipLabel: {
    color: colors.white,
    ...typography.label,
  },
  deniedBox: {
    width: '100%',
    marginTop: spacing.sm,
  },
  deniedText: {
    color: colors.textSecondary,
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
