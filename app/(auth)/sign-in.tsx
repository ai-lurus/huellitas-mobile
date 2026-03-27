import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../src/design/tokens';
import { SignInForm } from '../../src/components/auth/SignInForm';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

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
            onSuccess={({ isFirstLogin }) => {
              if (isFirstLogin) {
                router.replace('/onboarding');
                return;
              }
              router.replace('/(app)');
            }}
            onGooglePress={() => router.push('/(auth)/oauth/google')}
            onApplePress={() => router.push('/(auth)/oauth/apple')}
            onSignUpPress={() => router.push('/(auth)/sign-up')}
          />
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
});
