import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEY_LOCATION_BG_PROMPT_DECLINED } from '../../config/constants';
import { colors, radius, spacing, typography } from '../../design/tokens';
import { useLocation } from '../../hooks/useLocation';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';

/**
 * Integración raíz: permisos de ubicación, seguimiento en primer plano y avisos si falla el GPS o el permiso.
 */
export function LocationAppIntegration(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const locationError = useLocationStore((s) => s.locationError);
  const setLocationError = useLocationStore((s) => s.setLocationError);
  const {
    refresh,
    requestForeground,
    requestBackgroundWithExplanation,
    foregroundStatus,
    openSettings,
  } = useLocationPermission();
  const { startWatching, stopWatching } = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      stopWatching();
      return;
    }

    let cancelled = false;

    void (async (): Promise<void> => {
      await refresh();
      if (cancelled) return;

      const fgInitial = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (fgInitial.status === 'undetermined') {
        await requestForeground();
      }

      await refresh();
      if (cancelled) return;

      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();
      if (cancelled) return;

      if (fg.status === 'granted' && bg.status === 'undetermined') {
        const skip = await AsyncStorage.getItem(STORAGE_KEY_LOCATION_BG_PROMPT_DECLINED);
        if (skip !== '1') {
          const r = await requestBackgroundWithExplanation();
          if (r.declinedExplanationDialog) {
            await AsyncStorage.setItem(STORAGE_KEY_LOCATION_BG_PROMPT_DECLINED, '1');
          }
        }
      }

      if (cancelled) return;
      if (fg.status === 'granted' && AppState.currentState === 'active') {
        await startWatching();
      }
    })();

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void startWatching();
      } else {
        stopWatching();
      }
    });

    return (): void => {
      cancelled = true;
      sub.remove();
      stopWatching();
    };
  }, [
    isAuthenticated,
    refresh,
    requestForeground,
    requestBackgroundWithExplanation,
    startWatching,
    stopWatching,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  if (foregroundStatus === 'denied') {
    return (
      <View
        style={[styles.banner, styles.bannerAbsolute, { paddingTop: insets.top }]}
        accessibilityRole="alert"
        testID="location.permission.denied.banner"
      >
        <Text style={styles.bannerText}>
          Sin acceso a la ubicación no podremos mostrarte alertas cercanas. Activa el permiso en
          Ajustes.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={openSettings}
          style={styles.bannerButton}
          testID="location.permission.openSettings"
        >
          <Text style={styles.bannerButtonLabel}>Abrir ajustes</Text>
        </Pressable>
      </View>
    );
  }

  if (locationError) {
    return (
      <View
        style={[styles.bannerMuted, styles.bannerAbsolute, { paddingTop: insets.top }]}
        accessibilityRole="alert"
        testID="location.gps.error.banner"
      >
        <Text style={styles.bannerText}>{locationError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLocationError(null)}
          style={styles.dismissLink}
          testID="location.error.dismiss"
        >
          <Text style={styles.dismissLinkLabel}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bannerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  banner: {
    backgroundColor: colors.dangerSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  bannerMuted: {
    backgroundColor: colors.infoBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.infoBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  bannerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  bannerButtonLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  dismissLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
  },
  dismissLinkLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
