import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, spacing } from '../../src/design/tokens';
import { SignInForm } from '../../src/components/auth/SignInForm';

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
  },
});
