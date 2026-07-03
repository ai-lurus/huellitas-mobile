import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../design/tokens';

export type PetProfileTabKey = 'datos' | 'carnet' | 'rutina';

const TABS: ReadonlyArray<{ key: PetProfileTabKey; label: string }> = [
  { key: 'datos', label: 'Datos' },
  { key: 'carnet', label: 'Carnet' },
  { key: 'rutina', label: 'Rutina' },
];

export interface PetProfileTabsProps {
  active: PetProfileTabKey;
  onChange: (tab: PetProfileTabKey) => void;
}

export function PetProfileTabs({ active, onChange }: PetProfileTabsProps): React.ReactElement {
  return (
    <View style={styles.row} testID="petProfile.tabs">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            testID={`petProfile.tab.${tab.key}`}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.tab, isActive ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, ...typography.bodyStrong },
  tabTextActive: { color: colors.white },
});
