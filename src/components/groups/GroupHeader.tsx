import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Group } from '../../domain/groups';
import { GROUP_TYPE_ICONS, GROUP_TYPE_LABELS } from '../../domain/groups';
import { colors, radius, spacing, typography } from '../../design/tokens';

interface GroupHeaderProps {
  group: Group;
  onLeave?: () => void;
  onJoin?: () => void;
  isLoading?: boolean;
}

export function GroupHeader({
  group,
  onLeave,
  onJoin,
  isLoading,
}: GroupHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        {group.photoUrl ? (
          <Image source={{ uri: group.photoUrl }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerEmoji}>{GROUP_TYPE_ICONS[group.type] ?? '👥'}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeLabel}>{GROUP_TYPE_LABELS[group.type]}</Text>
        </View>
        <Text style={styles.name}>{group.name}</Text>
        {group.description ? <Text style={styles.description}>{group.description}</Text> : null}
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.memberCount}>{group.memberCount} miembros</Text>
        </View>
        {group.isMember && onLeave ? (
          <Pressable style={styles.leaveBtn} onPress={onLeave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={styles.leaveText}>Dejar grupo</Text>
            )}
          </Pressable>
        ) : null}
        {!group.isMember && onJoin ? (
          <Pressable style={styles.joinBtn} onPress={onJoin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.joinText}>Unirse al grupo</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  banner: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  bannerImage: {
    width: '100%',
    height: 140,
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  bannerEmoji: {
    fontSize: 48,
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoBackground,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.infoBorder,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  memberCount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  joinText: {
    ...typography.button,
    color: colors.white,
  },
  leaveBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  leaveText: {
    ...typography.button,
    color: colors.danger,
  },
});
