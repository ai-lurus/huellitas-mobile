import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../src/design/tokens';

export default function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.sub}>
        Desde la pestaña Mapa puedes ver reportes cercanos en tiempo real.
      </Text>
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
  title: { color: colors.textPrimary, ...typography.heading },
  sub: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
