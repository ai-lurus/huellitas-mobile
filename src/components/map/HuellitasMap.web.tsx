import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../../design/tokens';
import { CenterButton } from './CenterButton';

interface HuellitasMapProps {
  children?: React.ReactNode;
  showCenterButton?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  mapRefOverride?: React.MutableRefObject<{
    animateToRegion: (_region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }) => void;
  } | null>;
}

export function HuellitasMap({
  children,
  showCenterButton = true,
  containerStyle,
}: HuellitasMapProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]} testID="huellitas-map">
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>Vista previa de mapa en web</Text>
        <Text style={styles.webText}>
          En navegador no cargamos react-native-maps. Usa móvil/emulador para ver mapa interactivo.
        </Text>
      </View>
      {children}
      {showCenterButton ? <CenterButton onPress={(): void => {}} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  webFallback: {
    flex: 1,
    margin: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#E9EDF4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  webTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  webText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
