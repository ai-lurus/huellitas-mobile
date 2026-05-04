import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, shadows, spacing } from '../../design/tokens';

interface CenterButtonProps {
  onPress: () => void;
}

export function CenterButton({ onPress }: CenterButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Centrar en mi ubicación"
      onPress={onPress}
      style={styles.button}
      testID="map.center-button"
    >
      <Ionicons color={colors.white} name="locate" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
});
