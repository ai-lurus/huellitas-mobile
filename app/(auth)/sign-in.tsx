import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../src/design/tokens';
import { SignInForm } from '../../src/components/auth/SignInForm';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { runGoogleSignInFlow } from '../../src/services/googleAuthService';
import { useAuthStore } from '../../src/stores/authStore';
import { queryClient } from '../../src/query/queryClient';

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [oauthError, setOauthError] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + spacing.xxl + spacing.lg + keyboardHeight,
            },
          ]}
        >
          <SignInForm
            oauthError={oauthError}
            onSuccess={({ isFirstLogin }) => {
              if (isFirstLogin) {
                router.replace('/(auth)/onboarding/step-1');
                return;
              }
              router.replace('/(app)');
            }}
            onGooglePress={async () => {
              setOauthError(null);
              const { result, navigateTo } = await runGoogleSignInFlow();
              if (result.status === 'cancelled') {
                return;
              }
              if (result.status === 'error') {
                setOauthError(result.message);
                return;
              }
              if (navigateTo) {
                router.replace(navigateTo);
              }
            }}
            onApplePress={() => router.push('/(auth)/oauth/apple')}
            onSignUpPress={() => router.push('/(auth)/sign-up')}
          />
          <Pressable
            accessibilityRole="button"
            testID="signIn.continueAsGuest"
            onPress={() => {
              useAuthStore.getState().enterGuestMode();
              // Evita servir datos cacheados/persistidos de una identidad anterior en este dispositivo.
              queryClient.clear();
              router.replace('/(app)/map' as Href);
            }}
            style={styles.guestLink}
            hitSlop={8}
          >
            <Text style={styles.guestLinkText}>Continuar sin cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'center',
  },
  guestLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  guestLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
