import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { BREAKPOINT_TABLET } from '../../design/breakpoints';

import { PlakaIcon } from '../icons/PlakaIcon';

const TAB_ICON = 22;
const FLOATING_MARGIN = 16;
// Orden y set de tabs del PRD: Inicio/Mascotas/Radar/Servicios/Perfil.
const TAB_ROUTES = new Set(['index', 'pets', 'map', 'services', 'profile']);

export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFloating = width >= BREAKPOINT_TABLET;

  return (
    <View
      testID="appTabBar.wrap"
      style={[
        styles.wrap,
        isFloating ? styles.wrapFloating : styles.wrapFullBar,
        isFloating
          ? { marginBottom: Math.max(insets.bottom, FLOATING_MARGIN) }
          : { paddingBottom: Math.max(insets.bottom, spacing.sm) },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          // Evita duplicados cuando hay rutas anidadas (p. ej. profile/settings)
          if (route.name.includes('/')) {
            return null;
          }
          // Solo renderiza las tabs principales (evita rutas extra como `notifications`)
          if (!TAB_ROUTES.has(route.name)) {
            return null;
          }
          const { options } = descriptors[route.key];
          const label =
            options.title != null && String(options.title).length > 0
              ? String(options.title)
              : route.name;
          const isFocused = state.index === index;
          const color = isFocused ? colors.primary : colors.textSecondary;

          const onPress = (): void => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let icon: React.ReactNode = (
            <Ionicons name="ellipse-outline" size={TAB_ICON} color={color} />
          );
          if (route.name === 'index') {
            icon = (
              <Ionicons name={isFocused ? 'home' : 'home-outline'} size={TAB_ICON} color={color} />
            );
          } else if (route.name === 'map') {
            icon = <PlakaIcon name="radar" size={TAB_ICON} color={color} />;
          } else if (route.name === 'pets') {
            icon = <PlakaIcon name="carnet-id" size={TAB_ICON} color={color} />;
          } else if (route.name === 'services') {
            icon = (
              <Ionicons
                name={isFocused ? 'storefront' : 'storefront-outline'}
                size={TAB_ICON}
                color={color}
              />
            );
          } else if (route.name === 'profile') {
            icon = <PlakaIcon name="contacto" size={TAB_ICON} color={color} />;
          }

          return (
            <Pressable
              key={route.key}
              testID={`tab.${route.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.tab}
            >
              {icon}
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  wrapFullBar: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  wrapFloating: {
    marginHorizontal: FLOATING_MARGIN,
    borderRadius: radius.full,
    borderTopWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    minHeight: 52,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxs,
    gap: spacing.xxs,
  },
  tabLabel: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
});
