import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing, typography } from '../../src/design/tokens';

export default function MapScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map Feed - FE-010</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  text: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
});
