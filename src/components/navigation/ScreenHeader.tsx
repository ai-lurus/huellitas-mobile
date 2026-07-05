import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../../design/tokens';

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  testID?: string;
}

export function ScreenHeader({
  title,
  onBack,
  rightSlot,
  testID = 'screenHeader',
}: ScreenHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top + spacing.sm;

  if (!onBack) {
    return (
      <View style={[styles.rootRow, { paddingTop }]} testID={testID}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Image
              accessibilityLabel="Huellitas"
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.rootTitle} numberOfLines={1} testID={`${testID}.title`}>
            {title}
          </Text>
        </View>
        {rightSlot ? (
          <View style={styles.rightSlot} testID={`${testID}.rightSlot`}>
            {rightSlot}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.detailRow, { paddingTop }]} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backCircle}
        testID={`${testID}.back`}
      >
        <Ionicons name="chevron-back" size={22} color={colors.white} />
      </Pressable>
      <Text style={styles.detailTitle} numberOfLines={1} testID={`${testID}.title`}>
        {title}
      </Text>
      {rightSlot ? (
        <View style={styles.rightSlot} testID={`${testID}.rightSlot`}>
          {rightSlot}
        </View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 28, height: 28 },
  rootTitle: { ...typography.bodyStrong, color: colors.textPrimary, flexShrink: 1 },
  rightSlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  spacer: { width: 40 },
});
