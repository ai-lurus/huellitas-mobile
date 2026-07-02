import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { syncBetterAuthSessionToAuthStore } from '../src/services/googleAuthService';
import { colors } from '../src/design/tokens';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export default function Index(): React.JSX.Element {
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    let cancelled = false;
    void syncBetterAuthSessionToAuthStore().then((hasSession) => {
      if (cancelled) return;
      setAuthState(hasSession ? 'authenticated' : 'unauthenticated');
    });
    return (): void => {
      cancelled = true;
    };
  }, []);

  if (authState === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (authState === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
