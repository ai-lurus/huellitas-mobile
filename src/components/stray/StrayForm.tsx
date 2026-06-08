import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import type { StrayReportSubmitInput } from '../../validation/strayReportSchema';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { LocationPicker } from '../map/LocationPicker';
import { useReverseGeocodeLabel } from '../../hooks/useReverseGeocodeLabel';

type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

interface StrayFormProps {
  lat: number;
  lng: number;
  onSubmit: (input: StrayReportSubmitInput) => void;
  isSubmitting: boolean;
}

const SPECIES_OPTIONS: { value: Species; label: string; emoji: string }[] = [
  { value: 'dog', label: 'Perro', emoji: '🐶' },
  { value: 'cat', label: 'Gato', emoji: '🐱' },
  { value: 'bird', label: 'Ave', emoji: '🐦' },
  { value: 'rabbit', label: 'Conejo', emoji: '🐰' },
  { value: 'other', label: 'Otro', emoji: '🐾' },
];

const MAX_PHOTOS = 3;

export function StrayForm({ lat, lng, onSubmit, isSubmitting }: StrayFormProps): React.JSX.Element {
  const [species, setSpecies] = useState<Species>('dog');
  const [selectedLat, setSelectedLat] = useState(lat);
  const [selectedLng, setSelectedLng] = useState(lng);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const geocodeLabel = useReverseGeocodeLabel({ lat: selectedLat, lng: selectedLng });

  async function pickPhotos(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_PHOTOS - photoUris.length,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(uri: string): void {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }

  function handleSubmit(): void {
    if (!species) {
      setError('Selecciona el tipo de animal');
      return;
    }
    setError(null);
    onSubmit({
      species,
      lat: selectedLat,
      lng: selectedLng,
      color: color.trim() || undefined,
      description: description.trim() || undefined,
      photoUris: photoUris.length > 0 ? photoUris : undefined,
    });
  }

  const canAddMore = photoUris.length < MAX_PHOTOS;
  const locationAddress =
    geocodeLabel.data ?? `${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.sectionLabel}>¿Qué tipo de animal?</Text>
        <View style={styles.speciesRow}>
          {SPECIES_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setSpecies(opt.value)}
              style={[styles.speciesChip, species === opt.value && styles.speciesChipActive]}
              testID={`stray-form.species.${opt.value}`}
            >
              <Text style={styles.speciesEmoji}>{opt.emoji}</Text>
              <Text
                style={[styles.speciesLabel, species === opt.value && styles.speciesLabelActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Ubicación del avistamiento</Text>
        <Pressable
          onPress={() => setLocationModalOpen(true)}
          style={styles.locationRow}
          testID="stray-form.location"
        >
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {geocodeLabel.isLoading ? 'Cargando dirección…' : locationAddress}
            </Text>
            <Text style={styles.locationHint}>Toca para cambiar en el mapa</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.sectionLabel}>Fotos (opcional)</Text>
        <View style={styles.photosRow}>
          {photoUris.map((uri) => (
            <View key={uri} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
              <Pressable
                onPress={() => removePhoto(uri)}
                style={styles.photoRemove}
                testID="stray-form.photo.remove"
              >
                <Ionicons name="close-circle" size={20} color={colors.white} />
              </Pressable>
            </View>
          ))}
          {canAddMore ? (
            <Pressable
              onPress={() => void pickPhotos()}
              style={styles.photoAdd}
              testID="stray-form.photo.add"
            >
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.photoAddLabel}>
                {photoUris.length === 0 ? 'Agregar foto' : 'Agregar más'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.photoHint}>
          {photoUris.length}/{MAX_PHOTOS} fotos
        </Text>

        <Text style={styles.sectionLabel}>Color (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. café con manchas blancas"
          placeholderTextColor={colors.textMuted}
          value={color}
          onChangeText={setColor}
          maxLength={100}
          testID="stray-form.color"
        />

        <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Collar, tamaño, comportamiento…"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={300}
          multiline
          numberOfLines={4}
          testID="stray-form.description"
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

        {error != null ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          testID="stray-form.submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitLabel}>Reportar animal</Text>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={locationModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar ubicación</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setLocationModalOpen(false)}
                testID="stray-form.location.close"
              >
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <Text style={styles.modalHint}>Toca en el mapa para marcar dónde viste al animal.</Text>
            <View style={styles.modalMap}>
              <LocationPicker
                initialCenter={{ lat: selectedLat, lng: selectedLng }}
                onSelect={(lat, lng) => {
                  setSelectedLat(lat);
                  setSelectedLng(lng);
                }}
                testID="stray-form.locationPicker"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLocationModalOpen(false)}
              style={styles.modalDone}
              testID="stray-form.location.done"
            >
              <Text style={styles.modalDoneText}>Confirmar ubicación</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.xs, paddingBottom: spacing.xxxl },
  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  speciesChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  speciesChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 138, 52, 0.08)',
  },
  speciesEmoji: { fontSize: 20 },
  speciesLabel: { ...typography.caption, color: colors.textSecondary },
  speciesLabelActive: { color: colors.accent, fontWeight: '700' },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
    ...shadows.md,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 114, 228, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1 },
  locationAddress: { ...typography.bodyStrong, color: colors.textPrimary },
  locationHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: { width: 80, height: 80 },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  photoHint: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  textArea: { height: 88, textAlignVertical: 'top' },
  charCount: { ...typography.caption, color: colors.textMuted, alignSelf: 'flex-end' },
  errorText: { ...typography.caption, color: colors.danger },
  submitBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    ...shadows.button,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: { ...typography.button, color: colors.white },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary },
  modalHint: { ...typography.caption, color: colors.textSecondary },
  modalMap: {
    height: 340,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDone: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  modalDoneText: { ...typography.button, color: colors.white },
});
