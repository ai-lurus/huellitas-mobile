import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../design/tokens';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onPress: () => void;
  disabled?: boolean;
}

export function LikeButton({
  liked,
  count,
  onPress,
  disabled,
}: LikeButtonProps): React.JSX.Element {
  return (
    <Pressable style={styles.container} onPress={onPress} disabled={disabled} testID="like-button">
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={20}
        color={liked ? colors.danger : colors.textSecondary}
      />
      <Text style={[styles.count, liked && styles.countLiked]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  countLiked: {
    color: colors.danger,
  },
});
