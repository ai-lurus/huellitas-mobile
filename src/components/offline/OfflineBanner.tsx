import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

import { colors, radius, spacing, typography } from '../../design/tokens';

export function OfflineBanner(): React.JSX.Element | null {
  const netInfo = useNetInfo();

  const isOffline = useMemo(() => {
    // Si no sabemos aún, no mostramos nada para evitar flash.
    if (netInfo.isConnected == null) return false;
    if (netInfo.isInternetReachable == null) return !netInfo.isConnected;
    return !netInfo.isConnected || netInfo.isInternetReachable === false;
  }, [netInfo.isConnected, netInfo.isInternetReachable]);

  if (!isOffline) return null;

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityRole="alert">
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.text}>Sin conexión</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  text: {
    ...typography.caption,
    color: colors.white,
  },
});
