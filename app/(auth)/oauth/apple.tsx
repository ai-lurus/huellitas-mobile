import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { colors, spacing, typography } from '../../../src/design/tokens';
import { env } from '../../../src/config/env';

export default function AppleOAuthScreen(): React.JSX.Element {
  useEffect(() => {
    let isMounted = true;

    const run = async (): Promise<void> => {
      try {
        const url = `${env.EXPO_PUBLIC_BETTER_AUTH_URL}/oauth/apple`;
        await WebBrowser.openBrowserAsync(url);
      } catch {
        // Errores del navegador no bloquean la pantalla
      }
      if (!isMounted) {
        return;
      }
    };

    void run();

    return (): void => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.text}>Abriendo Apple…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
