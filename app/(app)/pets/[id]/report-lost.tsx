import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LocationPicker } from '../../../../src/components/map/LocationPicker';
import { colors, radius, shadows, spacing, typography } from '../../../../src/design/tokens';
import { MAX_LOST_REPORT_MESSAGE_LENGTH } from '../../../../src/config/constants';
import { useCreateLostReportMutation } from '../../../../src/hooks/useLostReports';
import { usePet } from '../../../../src/hooks/usePets';
import { useLocationStore } from '../../../../src/stores/locationStore';
import { useSettingsStore } from '../../../../src/stores/settingsStore';
import {
  combineReportDateTime,
  reportLostDetailsFormSchema,
  reportLostSubmitSchema,
  type ReportLostDetailsForm,
} from '../../../../src/validation/reportLostSchema';
import type { CreateLostReportResult } from '../../../../src/services/reportsService';

import DOG_DEFAULT from '../../../../assets/pet-defaults/dog.png';
import CAT_DEFAULT from '../../../../assets/pet-defaults/cat.png';
import BIRD_DEFAULT from '../../../../assets/pet-defaults/bird.png';
import RABBIT_DEFAULT from '../../../../assets/pet-defaults/rabbit.png';
import OTHER_DEFAULT from '../../../../assets/pet-defaults/other.png';

type Step = 'details' | 'location' | 'preview';

function defaultCoverForSpecies(species: string | undefined): number {
  switch (species) {
    case 'dog':
      return DOG_DEFAULT;
    case 'cat':
      return CAT_DEFAULT;
    case 'bird':
      return BIRD_DEFAULT;
    case 'rabbit':
      return RABBIT_DEFAULT;
    default:
      return OTHER_DEFAULT;
  }
}

function formatDateEs(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatTimeEs(d: Date): string {
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(d);
}

export default function ReportLostScreen(): React.ReactElement {
  const router = useRouter();
  const { id: petIdParam } = useLocalSearchParams<{ id: string }>();
  const petId = petIdParam ?? '';

  const petQuery = usePet(petId);
  const pet = petQuery.data;
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('details');
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'loading' | 'success'>('idle');
  const [submitResult, setSubmitResult] = useState<CreateLostReportResult | null>(null);

  const createMutation = useCreateLostReportMutation(petId);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReportLostDetailsForm>({
    resolver: zodResolver(reportLostDetailsFormSchema),
    defaultValues: {
      lastSeenDate: new Date(),
      lastSeenTime: new Date(),
      message: '',
    },
  });

  const messageLen = watch('message')?.length ?? 0;

  const photoUri = useMemo(() => {
    const photos = pet?.photos?.filter((u) => typeof u === 'string' && u.trim().length > 0) ?? [];
    return photos[0] ?? null;
  }, [pet?.photos]);

  const onBack = useCallback((): void => {
    if (step === 'details') {
      router.back();
      return;
    }
    if (step === 'location') {
      setStep('details');
      return;
    }
    setStep('location');
  }, [router, step]);

  const onDetailsNext = handleSubmit(() => {
    setStep('location');
  });

  const onLocationConfirm = useCallback((): void => {
    if (pinLocation == null) return;
    setStep('preview');
  }, [pinLocation]);

  const runSubmit: SubmitHandler<ReportLostDetailsForm> = useCallback(
    async (data) => {
      if (pinLocation == null) return;
      const lastSeenAt = combineReportDateTime(data.lastSeenDate, data.lastSeenTime);
      const trimmed = data.message?.trim();
      const parsed = reportLostSubmitSchema.safeParse({
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        lastSeenAt,
        message: trimmed && trimmed.length > 0 ? trimmed : undefined,
      });
      if (!parsed.success) return;

      setSubmitPhase('loading');
      try {
        const result = await createMutation.mutateAsync({
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          lastSeenAt: parsed.data.lastSeenAt.toISOString(),
          message: parsed.data.message,
        });
        setSubmitResult(result);
        setSubmitPhase('success');
      } catch {
        setSubmitPhase('idle');
        Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
      }
    },
    [createMutation, pinLocation],
  );

  const onSuccessDismiss = useCallback((): void => {
    const rid = submitResult?.id;
    setSubmitPhase('idle');
    setSubmitResult(null);
    if (rid) {
      router.replace(`/(app)/reports/${rid}`);
    }
  }, [router, submitResult?.id]);

  const onViewMap = useCallback((): void => {
    setSubmitPhase('idle');
    setSubmitResult(null);
    router.replace('/(app)/map');
  }, [router]);

  if (petQuery.isPending || !pet) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {step === 'details' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.detailsScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <Pressable
                accessibilityLabel="Volver"
                onPress={onBack}
                style={styles.backCircle}
                testID="reportLost.back"
              >
                <Ionicons color={colors.white} name="chevron-back" size={22} />
              </Pressable>
              <Text style={styles.headerTitle}>Detalles del reporte</Text>
              <View style={styles.headerSpacer} />
            </View>

            <Text style={styles.fieldLabel}>Foto de la mascota</Text>
            <View style={styles.photoWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <Image
                  accessibilityLabel="Foto por defecto"
                  resizeMode="cover"
                  source={defaultCoverForSpecies(pet.species)}
                  style={styles.photo}
                />
              )}
              <View style={styles.prefillBadge}>
                <Text style={styles.prefillBadgeText}>Pre-llenada</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>
              Fecha de última vez visto <Text style={styles.req}>*</Text>
            </Text>
            <Controller
              control={control}
              name="lastSeenDate"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable
                    onPress={(): void => setShowDate(true)}
                    style={styles.inputRow}
                    testID="reportLost.field.date"
                  >
                    <Ionicons color={colors.textSecondary} name="calendar-outline" size={20} />
                    <Text style={styles.inputRowText}>
                      {value.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </Pressable>
                  {showDate ? (
                    <>
                      <DateTimePicker
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        mode="date"
                        value={value}
                        onChange={(e: DateTimePickerEvent, d?: Date): void => {
                          if (Platform.OS === 'android' && e.type === 'dismissed') {
                            setShowDate(false);
                            return;
                          }
                          if (d) onChange(d);
                          if (Platform.OS === 'android') setShowDate(false);
                        }}
                      />
                      {Platform.OS === 'ios' ? (
                        <Pressable
                          onPress={(): void => setShowDate(false)}
                          style={styles.pickerDone}
                        >
                          <Text style={styles.pickerDoneText}>Listo</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}
            />
            {errors.lastSeenDate ? (
              <Text style={styles.fieldError}>{errors.lastSeenDate.message}</Text>
            ) : null}

            <Text style={styles.fieldLabel}>
              Hora aproximada <Text style={styles.req}>*</Text>
            </Text>
            <Controller
              control={control}
              name="lastSeenTime"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable
                    onPress={(): void => setShowTime(true)}
                    style={styles.inputRow}
                    testID="reportLost.field.time"
                  >
                    <Ionicons color={colors.textSecondary} name="time-outline" size={20} />
                    <Text style={styles.inputRowText}>
                      {value.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                  {showTime ? (
                    <>
                      <DateTimePicker
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        mode="time"
                        value={value}
                        onChange={(e: DateTimePickerEvent, d?: Date): void => {
                          if (Platform.OS === 'android' && e.type === 'dismissed') {
                            setShowTime(false);
                            return;
                          }
                          if (d) onChange(d);
                          if (Platform.OS === 'android') setShowTime(false);
                        }}
                      />
                      {Platform.OS === 'ios' ? (
                        <Pressable
                          onPress={(): void => setShowTime(false)}
                          style={styles.pickerDone}
                        >
                          <Text style={styles.pickerDoneText}>Listo</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}
            />
            {errors.lastSeenTime ? (
              <Text style={styles.fieldError}>{errors.lastSeenTime.message}</Text>
            ) : null}

            <Text style={styles.fieldLabel}>Mensaje adicional (opcional)</Text>
            <Controller
              control={control}
              name="message"
              render={({ field: { value, onChange } }) => (
                <View style={styles.textAreaWrap}>
                  <Ionicons
                    color={colors.textSecondary}
                    name="chatbubble-ellipses-outline"
                    size={20}
                    style={styles.textAreaIcon}
                  />
                  <TextInput
                    maxLength={MAX_LOST_REPORT_MESSAGE_LENGTH}
                    multiline
                    onChangeText={onChange}
                    placeholder="Ej: Llevaba collar rojo, responde al nombre de Max..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.textArea}
                    testID="reportLost.field.message"
                    value={value}
                  />
                </View>
              )}
            />
            <Text style={styles.counter}>
              {messageLen}/{MAX_LOST_REPORT_MESSAGE_LENGTH} caracteres
            </Text>
            {errors.message ? (
              <Text style={styles.fieldError}>{errors.message.message}</Text>
            ) : null}

            <Pressable
              onPress={onDetailsNext}
              style={styles.primaryBtn}
              testID="reportLost.details.continue"
            >
              <Text style={styles.primaryBtnText}>Continuar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}

      {step === 'location' ? (
        <View style={styles.flex}>
          <View style={styles.mapHeader}>
            <Pressable
              accessibilityLabel="Volver"
              onPress={onBack}
              style={styles.backCircle}
              testID="reportLost.location.back"
            >
              <Ionicons color={colors.white} name="chevron-back" size={22} />
            </Pressable>
            <Text style={styles.mapHeaderTitle}>Ubicación de pérdida</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.mapBody}>
            <LocationPicker
              initialCenter={currentLocation}
              onSelect={(lat: number, lng: number): void => setPinLocation({ lat, lng })}
              testID="reportLost.locationPicker"
            />
            <View pointerEvents="box-none" style={styles.mapHint}>
              <View style={styles.mapHintCard}>
                <Ionicons color={colors.navActive} name="location" size={18} />
                <Text style={styles.mapHintText}>Toca el mapa para marcar la ubicación</Text>
              </View>
            </View>
            <View
              style={[styles.mapFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            >
              <Pressable
                disabled={pinLocation == null}
                onPress={onLocationConfirm}
                style={[
                  styles.confirmLocBtn,
                  pinLocation == null ? styles.confirmLocBtnDisabled : null,
                ]}
                testID="reportLost.location.confirm"
              >
                <Ionicons
                  color={pinLocation == null ? colors.textMuted : colors.white}
                  name="location"
                  size={20}
                />
                <Text
                  style={[
                    styles.confirmLocBtnText,
                    pinLocation == null ? styles.confirmLocBtnTextDisabled : null,
                  ]}
                >
                  Confirmar ubicación
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {step === 'preview' ? (
        <ScrollView
          contentContainerStyle={styles.previewScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Volver"
              onPress={onBack}
              style={styles.backCircle}
              testID="reportLost.preview.back"
            >
              <Ionicons color={colors.white} name="chevron-back" size={22} />
            </Pressable>
            <Text style={styles.headerTitle}>Vista previa</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.warnBox}>
            <Ionicons color={colors.danger} name="warning" size={22} />
            <Text style={styles.warnText}>
              <Text style={styles.warnBold}>Reporte de mascota perdida. </Text>
              Este reporte se enviará a todos los usuarios cercanos y quedará visible en el mapa.
            </Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewCardTop}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.previewThumb} />
              ) : (
                <Image
                  resizeMode="cover"
                  source={defaultCoverForSpecies(pet.species)}
                  style={styles.previewThumb}
                />
              )}
              <View style={styles.lostTag}>
                <Text style={styles.lostTagText}>● PERDIDO</Text>
              </View>
            </View>
            <Text style={styles.previewCardTitle}>Mascota perdida</Text>
            {pinLocation ? (
              <View style={styles.previewRow}>
                <Ionicons color={colors.textSecondary} name="location-outline" size={18} />
                <Text style={styles.previewRowText} testID="reportLost.preview.coords">
                  Lat: {pinLocation.lat.toFixed(6)}, Lng: {pinLocation.lng.toFixed(6)}
                </Text>
              </View>
            ) : null}
            <View style={styles.previewRow}>
              <Ionicons color={colors.textSecondary} name="calendar-outline" size={18} />
              <Text style={styles.previewRowText}>
                {formatDateEs(combineReportDateTime(watch('lastSeenDate'), watch('lastSeenTime')))}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Ionicons color={colors.textSecondary} name="time-outline" size={18} />
              <Text style={styles.previewRowText}>
                {formatTimeEs(combineReportDateTime(watch('lastSeenDate'), watch('lastSeenTime')))}
              </Text>
            </View>
            {watch('message')?.trim() ? (
              <View style={styles.previewRow}>
                <Ionicons color={colors.textSecondary} name="chatbubble-outline" size={18} />
                <Text style={styles.previewRowText}>{watch('message')?.trim()}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>¿Qué sucederá después?</Text>
            <Text style={styles.infoLine}>
              • Se notificará a usuarios en un radio de {alertRadiusKm} km
            </Text>
            <Text style={styles.infoLine}>• Tu reporte aparecerá en el mapa público</Text>
            <Text style={styles.infoLine}>• Recibirás alertas de posibles avistamientos</Text>
          </View>

          <Pressable
            disabled={createMutation.isPending}
            onPress={handleSubmit(runSubmit)}
            style={[styles.dangerBtn, createMutation.isPending ? styles.dangerBtnDisabled : null]}
            testID="reportLost.submit"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.dangerBtnText}>Enviar alerta de pérdida</Text>
            )}
          </Pressable>
        </ScrollView>
      ) : null}

      <Modal animationType="fade" transparent visible={submitPhase === 'loading'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator color={colors.navActive} size="large" />
            <Text style={styles.modalTitle}>Enviando reporte…</Text>
            <Text style={styles.modalSub}>
              Estamos notificando a usuarios cercanos y publicando tu alerta
            </Text>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={submitPhase === 'success'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons color={colors.white} name="checkmark" size={32} />
            </View>
            <Text style={styles.modalTitle}>¡Reporte enviado!</Text>
            <Text style={styles.modalBody}>
              Tu alerta de mascota perdida se ha publicado exitosamente. Notificaremos a usuarios
              cercanos y te contactaremos si hay avistamientos.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statOrange}>
                  {submitResult?.notifiedUsersCount != null ? submitResult.notifiedUsersCount : '—'}
                </Text>
                <Text style={styles.statLabel}>Usuarios notificados</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statBlue}>
                  {submitResult?.searchRadiusKm != null
                    ? `${submitResult.searchRadiusKm} km`
                    : `${alertRadiusKm} km`}
                </Text>
                <Text style={styles.statLabel}>Radio de búsqueda</Text>
              </View>
            </View>
            <Pressable
              onPress={onSuccessDismiss}
              style={styles.successBtn}
              testID="reportLost.success.ok"
            >
              <Text style={styles.successBtnText}>Entendido</Text>
            </Pressable>
            <Pressable onPress={onViewMap} testID="reportLost.success.viewMap">
              <Text style={styles.linkMuted}>Ver en el mapa</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  detailsScroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  req: { color: colors.danger },
  photoWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 200,
    backgroundColor: colors.border,
  },
  photo: { width: '100%', height: '100%' },
  prefillBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(30,42,68,0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  prefillBadgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputRowText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: 4 },
  textAreaWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  textAreaIcon: { marginTop: 2 },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  counter: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  primaryBtn: {
    marginTop: spacing.lg,
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.navActive,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryBtnText: { ...typography.button, color: colors.white },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundApp,
  },
  mapHeaderTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  mapBody: { flex: 1, position: 'relative' },
  mapHint: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 100,
  },
  mapHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'center',
    ...shadows.md,
  },
  mapHintText: { ...typography.caption, color: colors.textPrimary, flexShrink: 1 },
  mapFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(249, 248, 246, 0.92)',
  },
  pickerDone: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pickerDoneText: { ...typography.bodyStrong, color: colors.primary },
  confirmLocBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.navActive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.button,
  },
  confirmLocBtnDisabled: { backgroundColor: colors.border },
  confirmLocBtnText: { ...typography.button, color: colors.white },
  confirmLocBtnTextDisabled: { color: colors.textMuted },
  previewScroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  warnBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    marginBottom: spacing.md,
  },
  warnText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 22 },
  warnBold: { fontWeight: '700' },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  previewCardTop: { position: 'relative', marginBottom: spacing.sm },
  previewThumb: { width: '100%', height: 160, borderRadius: radius.md },
  lostTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.navActive,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  lostTagText: { ...typography.caption, color: colors.white, fontWeight: '800' },
  previewCardTitle: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  previewRowText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 22 },
  infoBox: {
    backgroundColor: colors.infoBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  infoTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: spacing.xs },
  infoLine: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  dangerBtn: {
    height: 54,
    borderRadius: radius.button,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnDisabled: { opacity: 0.6 },
  dangerBtnText: { ...typography.button, color: colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  modalSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
