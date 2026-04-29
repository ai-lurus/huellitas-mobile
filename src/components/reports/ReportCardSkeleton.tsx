import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../design/tokens';

export function ReportCardSkeleton(): React.ReactElement {
  return (
    <View accessibilityLabel="Cargando reportes" style={styles.card} testID="report-card-skeleton">
      <View style={styles.cardInner}>
        <View style={styles.strip} />
        <View style={styles.row}>
          <View style={styles.thumb} />
          <View style={styles.content}>
            <View style={[styles.line, { width: '55%' }]} />
            <View style={[styles.line, { width: '38%', marginTop: spacing.xs }]} />
            <View style={[styles.line, { width: '46%', marginTop: spacing.sm }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardInner: { flexDirection: 'row', alignItems: 'stretch' },
  strip: {
    width: 4,
    backgroundColor: '#E2E4E8',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: '#ECEFF5',
  },
  content: { flex: 1, minWidth: 0 },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ECEFF5',
  },
});
