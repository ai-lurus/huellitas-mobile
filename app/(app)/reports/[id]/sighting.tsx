import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { LocationPicker } from '../../../../src/components/map/LocationPicker';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';
import { MAX_LOST_REPORT_MESSAGE_LENGTH } from '../../../../src/config/constants';
import {
  useCreateSightingMutation,
  useLostReportDetail,
} from '../../../../src/hooks/useLostReports';
import { useLocationStore } from '../../../../src/stores/locationStore';
import { useSettingsStore } from '../../../../src/stores/settingsStore';
import {
  sightingFormSchema,
  type SightingFormInput,
  SIGHTING_NOTES_MAX_LENGTH,
} from '../../../../src/validation/sightingSchema';

function firstN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

const MAX_PHOTOS = 5;

async function pickFromCamera(maxPhotos: number): Promise<string[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Necesitas permisos para usar la cámara.');
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });
  if (res.canceled) return [];
  return firstN(
    (res.assets ?? []).map((a) => a.uri).filter((u): u is string => u.length > 0),
    maxPhotos,
  );
}

async function pickFromGallery(remaining: number): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Necesitas permisos para acceder a tu galería.');
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.85,
  });
  if (res.canceled) return [];
  return firstN(
    (res.assets ?? []).map((a) => a.uri).filter((u): u is string => u.length > 0),
    remaining,
  );
}

export default function ReportSightingScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reportId = id ?? '';

  const detailQuery = useLostReportDetail(reportId);
  const createSightingMutation = useCreateSightingMutation(reportId);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);

  const [pickerBusy, setPickerBusy] = useState(false);
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitStats, setSubmitStats] = useState<{ notified?: number; radiusKm?: number } | null>(
    null,
  );

  const { control, setValue, handleSubmit, watch } = useForm<SightingFormInput>({
    resolver: zodResolver(sightingFormSchema),
    defaultValues: {
      photos: [],
      location: null,
      notes: '',
    },
    mode: 'onSubmit',
  });

  const selectedPhotos = watch('photos') ?? [];
  const selectedLocation = watch('location');

  const petLabel = detailQuery.data?.petName?.trim() || 'tu mascota';
  const petPhotoUrl = detailQuery.data?.petPhotoUrl ?? undefined;

  useEffect(() => {
    if (!selectedLocation && currentLocation) {
      setValue('location', { lat: currentLocation.lat, lng: currentLocation.lng });
    }
  }, [currentLocation, selectedLocation, setValue]);

  const onSelectLocation = useCallback(
    (lat: number, lng: number): void => {
      setValue('location', { lat, lng }, { shouldValidate: true });
    },
    [setValue],
  );

  const addPhotos = useCallback(
    async (uris: string[]): Promise<void> => {
      if (uris.length === 0) return;
      const current = selectedPhotos ?? [];
      const next = [...current, ...uris].filter(Boolean).slice(0, MAX_PHOTOS);
      setValue('photos', next, { shouldValidate: true });
    },
    [selectedPhotos, setValue],
  );

  const onPickCamera = useCallback(async (): Promise<void> => {
    if (pickerBusy) return;
    setPickerBusy(true);
    try {
      const uris = await pickFromCamera(MAX_PHOTOS - selectedPhotos.length);
      await addPhotos(uris);
    } catch (e) {
      Alert.alert(
        'No se pudo abrir la cámara',
        e instanceof Error ? e.message : 'Intenta de nuevo.',
      );
    } finally {
      setPickerBusy(false);
    }
  }, [addPhotos, pickerBusy, selectedPhotos.length]);

  const onPickGallery = useCallback(async (): Promise<void> => {
    if (pickerBusy) return;
    const remaining = MAX_PHOTOS - selectedPhotos.length;
    if (remaining <= 0) return;

    setPickerBusy(true);
    try {
      const uris = await pickFromGallery(remaining);
      await addPhotos(uris);
    } catch (e) {
      Alert.alert(
        'No se pudo abrir la galería',
        e instanceof Error ? e.message : 'Intenta de nuevo.',
      );
    } finally {
      setPickerBusy(false);
    }
  }, [addPhotos, pickerBusy, selectedPhotos.length]);

  const onBack = useCallback((): void => {
    if (step === 'form') {
      setStep('intro');
      return;
    }
    router.back();
  }, [router, step]);

  const openUploadPicker = useCallback((): void => {
    if (pickerBusy) return;
    Alert.alert('Subir foto', 'Elige una opción', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cámara', onPress: (): void => void onPickCamera() },
      { text: 'Galería', onPress: (): void => void onPickGallery() },
    ]);
  }, [onPickCamera, onPickGallery, pickerBusy]);

  const submit = handleSubmit(async (values) => {
    if (values.location == null) {
      Alert.alert('Falta la ubicación', 'Selecciona en el mapa dónde se vio la mascota.');
      return;
    }

    try {
      const res = await createSightingMutation.mutateAsync({
        lat: values.location.lat,
        lng: values.location.lng,
        notes: values.notes ?? undefined,
        photoUris: values.photos,
      });
      setSubmitStats({
        notified: res.notifiedUsersCount,
        radiusKm: res.searchRadiusKm ?? alertRadiusKm,
      });
      setSuccessOpen(true);
    } catch (e) {
      Alert.alert('Error al enviar avistamiento', 'Intenta nuevamente en unos minutos.');
    }
  });

  const notesMax = useMemo(
    () => Math.min(MAX_LOST_REPORT_MESSAGE_LENGTH, SIGHTING_NOTES_MAX_LENGTH),
    [],
  );

  const locationLabel = useMemo(() => {
    const loc = selectedLocation ?? currentLocation;
    if (!loc) return '—';
    return `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
  }, [currentLocation, selectedLocation]);

  const canSubmit = Boolean(selectedLocation) && !createSightingMutation.isPending;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {step === 'intro' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={onBack}
              style={styles.backBtn}
              testID="reportSighting.back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Reporte de avistamiento</Text>
            <View style={styles.backBtn} />
          </View>

          <Text style={styles.introTitle}>¿Viste a esta mascota?</Text>
          <Text style={styles.introSub}>
            Si has visto a esta mascota perdida, reporta el avistamiento para ayudar a su dueño a
            encontrarla.
          </Text>

          <View style={styles.introCard}>
            <View style={styles.introStrip} />
            <View style={styles.introCardBody}>
              <View style={styles.thumbWrap}>
                {petPhotoUrl ? (
                  <Image source={{ uri: petPhotoUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback} />
                )}
                <View style={styles.lostPill}>
                  <Text style={styles.lostPillText}>● PERDIDO</Text>
                </View>
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>{petLabel}</Text>
                <Text style={styles.summarySub}>
                  {detailQuery.data?.petSpecies ?? 'Mascota'}
                  {detailQuery.data?.petBreed ? ` • ${detailQuery.data.petBreed}` : ''}
                </Text>
                <View style={styles.introMetaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaPillText}>—</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaPillText}>—</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setStep('form')}
            style={styles.primaryBtn}
            testID="reportSighting.intro.cta"
          >
            <Text style={styles.primaryBtnText}>Reportar que la vi</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>¿Qué información necesita proporcionar?</Text>
            <Text style={styles.infoLine}>
              • Ubicación donde viste a la mascota (se usa tu ubicación actual)
            </Text>
            <Text style={styles.infoLine}>• Foto del avistamiento (opcional pero muy útil)</Text>
            <Text style={styles.infoLine}>• Detalles adicionales que puedan ayudar</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={onBack}
              style={styles.backBtn}
              testID="reportSighting.back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Reporte de avistamiento</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void submit()}
              disabled={!canSubmit}
              style={[styles.topSubmit, !canSubmit ? styles.topSubmitDisabled : null]}
              testID="reportSighting.topSubmit"
            >
              <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
              <Text style={styles.topSubmitText}>Reportar avistamiento</Text>
            </Pressable>
          </View>

          <View style={styles.bannerCard}>
            <View style={styles.bannerThumb}>
              {petPhotoUrl ? (
                <Image source={{ uri: petPhotoUrl }} style={styles.bannerThumbImg} />
              ) : (
                <View style={styles.bannerThumbImg} />
              )}
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{petLabel}</Text>
              <Text style={styles.bannerSub}>¿Viste a esta mascota?</Text>
            </View>
          </View>

          <Text style={styles.formLabel}>Ubicación del avistamiento</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <View>
                <Text style={styles.locationTitle}>Ubicación actual</Text>
                <Text style={styles.locationSub}>{locationLabel}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLocationModalOpen(true)}
              testID="reportSighting.location.change"
            >
              <Text style={styles.locationChange}>Cambiar</Text>
            </Pressable>
          </View>

          <Text style={styles.formLabel}>Foto del avistamiento (opcional)</Text>
          <Pressable
            accessibilityRole="button"
            disabled={pickerBusy}
            onPress={openUploadPicker}
            style={styles.uploadCard}
            testID="reportSighting.photo.upload"
          >
            {selectedPhotos[0] ? (
              <Image source={{ uri: selectedPhotos[0] }} style={styles.uploadPreview} />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons name="camera" size={22} color={colors.navActive} />
                </View>
                <Text style={styles.uploadTitle}>Subir foto</Text>
                <Text style={styles.uploadSub}>Desde cámara o galería</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.formLabel}>Detalles adicionales (opcional)</Text>
          <Controller
            name="notes"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.notesWrap}>
                <Ionicons
                  color={colors.textSecondary}
                  name="chatbubble-ellipses-outline"
                  size={18}
                  style={styles.notesIcon}
                />
                <TextInput
                  placeholder="Ej: La vi corriendo cerca del parque, llevaba collar azul..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.notesInput}
                  multiline
                  maxLength={notesMax}
                  value={value ?? ''}
                  onChangeText={onChange}
                  editable={!createSightingMutation.isPending}
                  testID="reportSighting.notes"
                />
              </View>
            )}
          />
          <Text style={styles.counter}>0/{notesMax} caracteres</Text>

          <View style={styles.warnCard}>
            <Text style={styles.warnText}>
              Tu reporte ayudará al dueño a saber que su mascota fue vista en esta área. Proporciona
              todos los detalles que puedas recordar.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void submit()}
            disabled={!canSubmit}
            style={[styles.bottomSubmit, !canSubmit ? styles.bottomSubmitDisabled : null]}
            testID="reportSighting.submit"
          >
            <Text style={styles.bottomSubmitText}>
              {createSightingMutation.isPending ? 'Enviando…' : 'Enviar avistamiento'}
            </Text>
          </Pressable>

          <Modal visible={locationModalOpen} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Cambiar ubicación</Text>
                  <Pressable accessibilityRole="button" onPress={() => setLocationModalOpen(false)}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>
                <View style={styles.modalMap}>
                  <LocationPicker
                    initialCenter={selectedLocation ?? currentLocation}
                    onSelect={onSelectLocation}
                    testID="reportSighting.locationPicker"
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLocationModalOpen(false)}
                  style={styles.modalDone}
                >
                  <Text style={styles.modalDoneText}>Listo</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Modal visible={successOpen} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={28} color={colors.white} />
                </View>
                <Text style={styles.successTitle}>¡Avistamiento reportado!</Text>
                <Text style={styles.successSub}>Gracias por ayudar a encontrar a {petLabel}</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statOrange}>
                      {submitStats?.notified != null ? submitStats.notified : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Usuarios notificados</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statBlue}>
                      {submitStats?.radiusKm != null
                        ? `${submitStats.radiusKm}km`
                        : `${alertRadiusKm}km`}
                    </Text>
                    <Text style={styles.statLabel}>Radio de búsqueda</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSuccessOpen(false);
                    router.replace(`/(app)/reports/${reportId}`);
                  }}
                  style={styles.successBtn}
                  testID="reportSighting.success.ok"
                >
                  <Text style={styles.successBtnText}>Entendido</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSuccessOpen(false);
                    router.replace('/(app)');
                  }}
                  testID="reportSighting.success.home"
                >
                  <Text style={styles.linkMuted}>Volver a inicio</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'left',
    marginLeft: spacing.sm,
  },

  topSubmit: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.button,
  },
  topSubmitDisabled: { opacity: 0.55 },
  topSubmitText: { ...typography.caption, color: colors.white, fontWeight: '800' },

  introTitle: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.xs },
  introSub: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  introStrip: {
    width: 4,
    backgroundColor: colors.navActive,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  introCardBody: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    alignItems: 'center',
  },
  lostPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.navActive,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  lostPillText: { ...typography.caption, color: colors.white, fontWeight: '900', fontSize: 10 },
  introMetaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(60,60,70,0.06)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },

  infoBox: {
    backgroundColor: 'rgba(94, 114, 228, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(94, 114, 228, 0.25)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.bodyStrong, color: colors.primary },
  infoLine: { ...typography.caption, color: colors.textPrimary, lineHeight: 18 },

  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.md,
  },
  thumbWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ECEFF5',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { width: '100%', height: '100%', backgroundColor: '#ECEFF5' },
  summaryText: { flex: 1, gap: 2 },
  summaryTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  summarySub: { ...typography.caption, color: colors.textSecondary },

  bannerCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(94, 114, 228, 0.10)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bannerThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ECEFF5',
  },
  bannerThumbImg: { width: '100%', height: '100%' },
  bannerText: { gap: 2 },
  bannerTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  bannerSub: { ...typography.caption, color: colors.primary },

  formLabel: { ...typography.label, color: colors.textPrimary, marginTop: spacing.sm },
  locationRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  locationSub: { ...typography.caption, color: colors.textSecondary },
  locationChange: { ...typography.caption, color: colors.primary, fontWeight: '800' },

  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 150,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  uploadSub: { ...typography.caption, color: colors.textSecondary },
  uploadPreview: { width: '100%', height: 160, borderRadius: radius.lg },

  notesIcon: { marginTop: 2 },

  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  fieldError: { ...typography.caption, color: colors.dangerDark, marginTop: 4 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoTile: {
    width: 86,
    height: 86,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  addTile: {
    width: 86,
    height: 86,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addTileDisabled: { opacity: 0.55 },
  addTileText: { ...typography.caption, color: colors.textSecondary },

  photoActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  secondaryBtnText: { ...typography.bodyStrong, color: colors.textSecondary },

  mapWrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notesInput: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    flex: 1,
  },
  counter: { ...typography.caption, color: colors.textMuted, textAlign: 'left' },

  warnCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
    padding: spacing.md,
  },
  warnText: { ...typography.caption, color: colors.dangerDark, lineHeight: 18 },

  bottomSubmit: {
    marginTop: spacing.lg,
    minHeight: 54,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  bottomSubmitDisabled: { opacity: 0.35 },
  bottomSubmitText: { ...typography.button, color: colors.white },

  primaryBtn: {
    marginTop: spacing.lg,
    minHeight: 54,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.button, color: colors.white, textAlign: 'center' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  modalMap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDone: {
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: { ...typography.button, color: colors.white },

  successCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  successSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.backgroundApp,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statOrange: { fontSize: 28, fontWeight: '800', color: colors.navActive },
  statBlue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  successBtn: {
    width: '100%',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  successBtnText: { ...typography.button, color: colors.white },
  linkMuted: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
