import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing, typography } from '../../src/design/tokens';

export default function AlertsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Alerta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundApp,
    padding: spacing.lg,
  },
  text: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
});
