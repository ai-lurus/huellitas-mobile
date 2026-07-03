import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../design/tokens';

export interface HomeHeaderProps {
  userName?: string;
  hasUnseenEvents: boolean;
  onSearchPress: () => void;
  onBellPress: () => void;
  testID?: string;
}

export function HomeHeader({
  userName,
  hasUnseenEvents,
  onSearchPress,
  onBellPress,
  testID = 'home.header',
}: HomeHeaderProps): React.JSX.Element {
  const greetingName = userName?.trim() || 'de nuevo';

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="PLAKA"
              source={require('../../../assets/icon.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandText}>PLAKA</Text>
        </View>
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.actionBtn}
            testID="home.search"
            onPress={onSearchPress}
          >
            <Ionicons name="search" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.actionBtn}
            testID="home.notifications"
            onPress={onBellPress}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {hasUnseenEvents && <View style={styles.dot} testID="home.notifications.dot" />}
          </Pressable>
        </View>
      </View>
      <View style={styles.greetingRow}>
        <Text style={styles.greetingTitle}>¡Hola, {greetingName}!</Text>
        <Text style={styles.greetingSubtitle}>Esto es lo que tienes hoy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 26, height: 26 },
  brandText: { ...typography.heading, color: colors.textPrimary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  greetingRow: { marginTop: spacing.md, gap: spacing.xxs },
  greetingTitle: { ...typography.title, color: colors.textPrimary },
  greetingSubtitle: { ...typography.body, color: colors.textSecondary },
});
