import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

const TAB_ICON = 22;
const ALERT_BUTTON_SIZE = 56;

export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.title != null && String(options.title).length > 0
              ? String(options.title)
              : route.name;
          const isFocused = state.index === index;
          const color = isFocused ? colors.navActive : colors.textSecondary;

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

          if (route.name === 'alerts') {
            return (
              <View key={route.key} style={styles.alertSlot}>
                <Pressable
                  testID="tab.alert"
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={label}
                  onPress={onPress}
                  style={styles.alertFab}
                >
                  <Ionicons name="notifications" size={26} color={colors.white} />
                </Pressable>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? colors.navActive : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          }

          let icon: React.ReactNode = (
            <Ionicons name="ellipse-outline" size={TAB_ICON} color={color} />
          );
          if (route.name === 'index') {
            icon = (
              <Ionicons name={isFocused ? 'home' : 'home-outline'} size={TAB_ICON} color={color} />
            );
          } else if (route.name === 'map') {
            icon = (
              <Ionicons
                name={isFocused ? 'location' : 'location-outline'}
                size={TAB_ICON}
                color={color}
              />
            );
          } else if (route.name === 'pets') {
            icon = <FontAwesome5 name="bone" size={20} color={color} />;
          } else if (route.name === 'profile') {
            icon = (
              <Ionicons
                name={isFocused ? 'person' : 'person-outline'}
                size={TAB_ICON}
                color={color}
              />
            );
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
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadows.md,
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
  alertSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -28,
    paddingBottom: spacing.xxs,
  },
  alertFab: {
    width: ALERT_BUTTON_SIZE,
    height: ALERT_BUTTON_SIZE,
    borderRadius: ALERT_BUTTON_SIZE / 2,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    shadowColor: colors.navActive,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
