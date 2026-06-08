import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Group } from '../../domain/groups';
import { GROUP_TYPE_ICONS } from '../../domain/groups';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface GroupChipProps {
  group: Group;
  onPress: () => void;
}

export function GroupChip({ group, onPress }: GroupChipProps): React.JSX.Element {
  return (
    <Pressable style={styles.chip} onPress={onPress} testID={`group-chip-${group.id}`}>
      <Text style={styles.icon}>{GROUP_TYPE_ICONS[group.type] ?? '👥'}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {group.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 14,
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    maxWidth: 100,
  },
});
