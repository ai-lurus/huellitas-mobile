import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../design/tokens';

export interface LocationPickerProps {
  onSelect: (lat: number, lng: number) => void;
  initialCenter?: { lat: number; lng: number } | null;
  testID?: string;
}

/** En web no hay mapa nativo; permite probar el flujo y los tests sin react-native-maps. */
export function LocationPicker({
  onSelect,
  testID = 'locationPicker',
}: LocationPickerProps): React.JSX.Element {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);

  const tapSimulated = useCallback((): void => {
    const lat = 19.432695;
    const lng = -99.134501;
    setSelected({ lat, lng });
    onSelect(lat, lng);
  }, [onSelect]);

  const useMyLocation = useCallback((): void => {
    const lat = 19.4326;
    const lng = -99.1332;
    setSelected({ lat, lng });
    onSelect(lat, lng);
  }, [onSelect]);

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.panel}>
        <Text style={styles.title}>Selector de ubicación (web)</Text>
        <Text style={styles.hint}>
          En el navegador no hay mapa interactivo. Usa los botones para simular coordenadas.
        </Text>
        <Pressable
          accessibilityLabel="Simular toque en el mapa"
          onPress={tapSimulated}
          style={styles.btn}
          testID={`${testID}.simulateMapTap`}
        >
          <Text style={styles.btnText}>Tocar mapa (simulado)</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Usar mi ubicación"
          onPress={useMyLocation}
          style={styles.btnSecondary}
          testID={`${testID}.useMyLocation`}
        >
          <Text style={styles.btnTextDark}>Usar mi ubicación</Text>
        </Pressable>
        {selected ? (
          <Text style={styles.coords} testID={`${testID}.coords`}>
            {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { ...typography.button, color: colors.white },
  btnTextDark: { ...typography.button, color: colors.textPrimary },
  coords: { ...typography.caption, color: colors.textSecondary },
});
