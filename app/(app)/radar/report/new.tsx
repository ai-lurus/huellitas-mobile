import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import {
  LostReportDataStep,
  type LostReportDataResult,
} from '../../../../src/components/radar/wizard/LostReportDataStep';
import {
  ReportReviewStep,
  type ReportPreviewData,
  type ReviewSubmitPhase,
} from '../../../../src/components/radar/wizard/ReportReviewStep';
import { ReportTypeStep } from '../../../../src/components/radar/wizard/ReportTypeStep';
import {
  StrayReportDataStep,
  type StrayReportDataResult,
} from '../../../../src/components/radar/wizard/StrayReportDataStep';
import { colors, spacing, typography } from '../../../../src/design/tokens';
import { usePets } from '../../../../src/hooks/usePets';
import { useCreateLostReportMutation } from '../../../../src/hooks/useLostReports';
import { useCreateStrayReport } from '../../../../src/hooks/useStrayReports';
import { savePendingRadarReport } from '../../../../src/services/pendingRadarReportStore';
import { useLocationStore } from '../../../../src/stores/locationStore';
import { useSettingsStore } from '../../../../src/stores/settingsStore';
import { DEFAULT_MAP_FALLBACK } from '../../../../src/config/constants';
import type { Pet } from '../../../../src/domain/pets';

type Step =
  | { kind: 'type' }
  | { kind: 'data-lost'; pet: Pet }
  | { kind: 'data-stray' }
  | { kind: 'review-lost'; pet: Pet; data: LostReportDataResult }
  | { kind: 'review-stray'; data: StrayReportDataResult };

export default function RadarCreateReportScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; petId?: string }>();
  const netInfo = useNetInfo();
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const { pets: petsData, isLoading: petsLoading } = usePets();
  const pets = useMemo(() => petsData ?? [], [petsData]);

  const [step, setStep] = useState<Step>({ kind: 'type' });
  const [dirty, setDirty] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<ReviewSubmitPhase>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lostPetId = step.kind === 'data-lost' || step.kind === 'review-lost' ? step.pet.id : '';
  const createLostMutation = useCreateLostReportMutation(lostPetId);
  const createStrayMutation = useCreateStrayReport();

  const requestedType = params.type === 'lost' || params.type === 'stray' ? params.type : undefined;
  const requestedPetId = params.petId;

  useEffect(() => {
    if (petsLoading) return;
    if (requestedType === 'lost' && requestedPetId) {
      const pet = pets.find((p) => p.id === requestedPetId);
      if (pet) setStep({ kind: 'data-lost', pet });
      return;
    }
    if (requestedType === 'stray') {
      setStep({ kind: 'data-stray' });
    }
    // requestedType === 'lost' sin petId, o sin type: se resuelve desde ReportTypeStep.
  }, [petsLoading, pets, requestedType, requestedPetId]);

  useEffect(() => {
    if (step.kind !== 'type') setDirty(true);
  }, [step.kind]);

  const goBack = useCallback((): void => {
    router.back();
  }, [router]);

  const handleBackPress = useCallback((): void => {
    if (!dirty) {
      goBack();
      return;
    }
    Alert.alert('¿Descartar reporte?', 'Perderás los datos que ya escribiste.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: goBack },
    ]);
  }, [dirty, goBack]);

  const onNoPets = useCallback((): void => {
    Alert.alert(
      'Necesitas una mascota registrada',
      'Para reportar una mascota perdida primero debes agregarla a tu carnet.',
      [
        { text: 'Ahora no', style: 'cancel' },
        {
          text: 'Agregar mascota',
          onPress: (): void => router.replace('/(app)/pets/new' as Href),
        },
      ],
    );
  }, [router]);

  const location = currentLocation ?? DEFAULT_MAP_FALLBACK;

  const isOnline = netInfo.isConnected === true && netInfo.isInternetReachable !== false;

  const onSubmitLost = useCallback(async (): Promise<void> => {
    if (step.kind !== 'review-lost') return;
    const { pet, data } = step;
    setSubmitError(null);

    if (!isOnline) {
      await savePendingRadarReport({
        kind: 'lost',
        petId: pet.id,
        createdAt: new Date().toISOString(),
        payload: {
          lat: data.lat,
          lng: data.lng,
          lastSeenAt: data.lastSeenAt.toISOString(),
          message: data.message,
        },
      });
      setSubmitPhase('pending');
      return;
    }

    setSubmitPhase('loading');
    try {
      await createLostMutation.mutateAsync({
        lat: data.lat,
        lng: data.lng,
        lastSeenAt: data.lastSeenAt.toISOString(),
        message: data.message,
      });
      setSubmitPhase('success');
    } catch {
      setSubmitPhase('idle');
      setSubmitError('No se pudo enviar el reporte. Intenta de nuevo.');
    }
  }, [step, isOnline, createLostMutation]);

  const onSubmitStray = useCallback(async (): Promise<void> => {
    if (step.kind !== 'review-stray') return;
    const { data } = step;
    setSubmitError(null);

    if (!isOnline) {
      await savePendingRadarReport({
        kind: 'stray',
        createdAt: new Date().toISOString(),
        payload: {
          species: data.species,
          lat: data.lat,
          lng: data.lng,
          seenAt: data.seenAt.toISOString(),
          color: data.color,
          description: data.description,
          photoUris: data.photoUris,
        },
      });
      setSubmitPhase('pending');
      return;
    }

    setSubmitPhase('loading');
    try {
      await createStrayMutation.mutateAsync({
        species: data.species,
        lat: data.lat,
        lng: data.lng,
        seenAt: data.seenAt,
        color: data.color,
        description: data.description,
        photoUris: data.photoUris,
      });
      setSubmitPhase('success');
    } catch {
      setSubmitPhase('idle');
      setSubmitError('No se pudo enviar el reporte. Intenta de nuevo.');
    }
  }, [step, isOnline, createStrayMutation]);

  const onDismissModal = useCallback((): void => {
    setSubmitPhase('idle');
    router.replace('/(app)/map' as Href);
  }, [router]);

  const onViewMap = useCallback((): void => {
    setSubmitPhase('idle');
    router.replace('/(app)/map' as Href);
  }, [router]);

  let body: React.ReactElement;
  let title: string;

  if (petsLoading && requestedType === 'lost' && requestedPetId) {
    title = 'Crear reporte';
    body = (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  } else if (step.kind === 'type') {
    title = 'Crear reporte';
    body = (
      <ReportTypeStep
        onNoPets={onNoPets}
        onSelectLost={(petId) => {
          const pet = pets.find((p) => p.id === petId);
          if (pet) setStep({ kind: 'data-lost', pet });
        }}
        onSelectStray={() => setStep({ kind: 'data-stray' })}
        pets={pets}
      />
    );
  } else if (step.kind === 'data-lost') {
    title = 'Mascota perdida';
    body = (
      <LostReportDataStep
        initialLocation={location}
        onSubmit={(data) => setStep({ kind: 'review-lost', pet: step.pet, data })}
        pet={step.pet}
      />
    );
  } else if (step.kind === 'data-stray') {
    title = 'Animal encontrado';
    body = (
      <StrayReportDataStep
        initialLocation={location}
        onSubmit={(data) => setStep({ kind: 'review-stray', data })}
      />
    );
  } else if (step.kind === 'review-lost') {
    title = 'Revisar reporte';
    const preview: ReportPreviewData = {
      kind: 'lost',
      title: `${step.pet.name ?? 'Mascota'} perdida`,
      badgeLabel: 'PERDIDO',
      badgeColor: colors.navActive,
      photoUri: step.pet.photos?.[0] ?? null,
      lat: step.data.lat,
      lng: step.data.lng,
      when: step.data.lastSeenAt,
      description: step.data.message,
    };
    body = (
      <ReportReviewStep
        infoLines={[
          `Se notificará a usuarios en un radio de ${alertRadiusKm} km`,
          'Tu reporte aparecerá en el mapa público',
          'Recibirás alertas de posibles avistamientos',
        ]}
        onSubmit={() => void onSubmitLost()}
        onSuccessDismiss={onDismissModal}
        onViewMap={onViewMap}
        preview={preview}
        submitError={submitError}
        submitPhase={submitPhase}
      />
    );
  } else {
    title = 'Revisar reporte';
    const preview: ReportPreviewData = {
      kind: 'stray',
      title: 'Animal encontrado',
      badgeLabel: 'ENCONTRADO',
      badgeColor: colors.accent,
      photoUri: step.data.photoUris[0] ?? null,
      lat: step.data.lat,
      lng: step.data.lng,
      when: step.data.seenAt,
      description: step.data.description,
    };
    body = (
      <ReportReviewStep
        infoLines={[
          'Tu reporte aparecerá en el mapa público',
          'Si hay un dueño buscándolo, se le notificará',
        ]}
        onSubmit={() => void onSubmitStray()}
        onSuccessDismiss={onDismissModal}
        onViewMap={onViewMap}
        preview={preview}
        submitError={submitError}
        submitPhase={submitPhase}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel="Volver"
          onPress={handleBackPress}
          style={styles.backCircle}
          testID="radar.wizard.back"
        >
          <Ionicons color={colors.white} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
});
