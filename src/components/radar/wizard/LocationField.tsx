import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows, spacing, typography } from '../../../design/tokens';
import { LocationPicker } from '../../map/LocationPicker';
import { useReverseGeocodeLabel } from '../../../hooks/useReverseGeocodeLabel';

export interface LocationFieldProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  testID?: string;
}

export function LocationField({
  lat,
  lng,
  onChange,
  testID = 'radar.wizard.location',
}: LocationFieldProps): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false);
  const geocodeLabel = useReverseGeocodeLabel({ lat, lng });
  const addressLabel = geocodeLabel.data ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return (
    <>
      <Pressable onPress={() => setModalOpen(true)} style={styles.row} testID={testID}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="location" size={18} />
        </View>
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.address}>
            {geocodeLabel.isLoading ? 'Cargando dirección…' : addressLabel}
          </Text>
          <Text style={styles.hint}>Toca para marcar en el mapa</Text>
        </View>
        <Ionicons color={colors.textSecondary} name="chevron-forward" size={16} />
      </Pressable>

      <Modal animationType="slide" transparent visible={modalOpen}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Seleccionar ubicación</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModalOpen(false)}
                testID={`${testID}.close`}
              >
                <Ionicons color={colors.textPrimary} name="close" size={22} />
              </Pressable>
            </View>
            <Text style={styles.modalHint}>
              Toca el mapa para marcar la ubicación. Si no compartes tu GPS, puedes colocar el pin
              manualmente.
            </Text>
            <View style={styles.map}>
              <LocationPicker
                initialCenter={{ lat, lng }}
                onSelect={onChange}
                testID={`${testID}.picker`}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setModalOpen(false)}
              style={styles.done}
              testID={`${testID}.done`}
            >
              <Text style={styles.doneText}>Confirmar ubicación</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 114, 228, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  address: { ...typography.bodyStrong, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.heading, color: colors.textPrimary },
  modalHint: { ...typography.caption, color: colors.textSecondary },
  map: {
    height: 340,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  done: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  doneText: { ...typography.button, color: colors.white },
});
