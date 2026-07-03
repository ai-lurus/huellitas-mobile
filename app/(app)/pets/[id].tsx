import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { PetProfileHeader } from '../../../src/components/pets/PetProfileHeader';
import { PetProfileTabs, type PetProfileTabKey } from '../../../src/components/pets/PetProfileTabs';
import { PetDatosTab } from '../../../src/components/pets/PetDatosTab';
import { PetCarnetTab } from '../../../src/components/pets/PetCarnetTab';
import {
  PetRutinaTab,
  type RoutineTaskFormValues,
} from '../../../src/components/pets/PetRutinaTab';
import { PetCardSkeleton } from '../../../src/components/pets/PetCard';
import { colors, radius, spacing, typography } from '../../../src/design/tokens';
import { usePet, usePets } from '../../../src/hooks/usePets';
import type { Pet } from '../../../src/domain/pets';
import {
  buildMockDocuments,
  buildMockVaccines,
  createMockVaccineId,
  type PetDocuments,
  type Vaccine,
} from '../../../src/domain/petCarnet';
import {
  buildMockRoutineTasks,
  createMockRoutineTaskId,
  type RoutineTask,
} from '../../../src/domain/petRoutine';

const PROFILE_TAB_KEYS = new Set<PetProfileTabKey>(['datos', 'carnet', 'rutina']);

function parseInitialTab(tab: string | undefined): PetProfileTabKey {
  return PROFILE_TAB_KEYS.has(tab as PetProfileTabKey) ? (tab as PetProfileTabKey) : 'datos';
}

export default function PetDetailScreen(): React.ReactElement {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const petId = id ?? '';
  const initialTab = parseInitialTab(tab);

  const petQuery = usePet(petId);
  const { deletePetMutation } = usePets();

  const pet = petQuery.data;

  const deleteCopy = useMemo(() => {
    const name = pet?.name?.trim() || 'esta mascota';
    return {
      title: `¿Eliminar tarjeta de ${name}?`,
      message:
        'Esta acción es permanente. Se borrará toda la información y fotos.\n\nNo se puede deshacer.',
    };
  }, [pet?.name]);

  const confirmDelete = useCallback(() => {
    Alert.alert(deleteCopy.title, deleteCopy.message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, eliminar tarjeta',
        style: 'destructive',
        onPress: (): void => {
          void (async (): Promise<void> => {
            try {
              await deletePetMutation.mutateAsync(petId);
              router.replace('/(app)/pets');
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la mascota. Intentá de nuevo.');
            }
          })();
        },
      },
    ]);
  }, [deleteCopy.message, deleteCopy.title, deletePetMutation, petId, router]);

  if (petQuery.isPending) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.skeletonWrap}>
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(i) => String(i)}
            contentContainerStyle={styles.skeletonList}
            renderItem={() => <PetCardSkeleton />}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorWrap}>
          <Ionicons name="paw-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>No encontramos esta mascota</Text>
          <Text style={styles.errorSubtitle}>
            Es posible que haya sido eliminada o que haya un problema de conexión.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
          >
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PetProfileBody
        pet={pet}
        initialTab={initialTab}
        onBack={() => router.back()}
        onEdit={() => router.push(`/(app)/pets/${petId}/edit`)}
        onReportLost={() => router.push(`/(app)/radar/report/new?type=lost&petId=${petId}` as Href)}
        onMarkFound={() => router.push(`/(app)/pets/${petId}/found`)}
        onQrCode={() => router.push(`/(app)/pets/${petId}/qr`)}
        onDelete={confirmDelete}
        isDeleting={deletePetMutation.isPending}
      />
    </SafeAreaView>
  );
}

interface PetProfileBodyProps {
  pet: Pet;
  initialTab: PetProfileTabKey;
  onBack: () => void;
  onEdit: () => void;
  onReportLost: () => void;
  onMarkFound: () => void;
  onQrCode: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

// Carnet y Rutina no tienen backend todavía (PRD §4.4/§4.5): estado mock semi-vivo,
// local a esta pantalla, no persiste entre sesiones.
function PetProfileBody({
  pet,
  initialTab,
  onBack,
  onEdit,
  onReportLost,
  onMarkFound,
  onQrCode,
  onDelete,
  isDeleting,
}: PetProfileBodyProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<PetProfileTabKey>(initialTab);
  const [vaccines, setVaccines] = useState<Vaccine[]>(() => buildMockVaccines(pet.id));
  const [documents, setDocuments] = useState<PetDocuments>(() => buildMockDocuments(pet));
  const [tasks, setTasks] = useState<RoutineTask[]>(() =>
    buildMockRoutineTasks(pet.id, pet.name ?? 'tu mascota'),
  );

  const handleAddVaccine = useCallback(
    (input: { name: string; appliedAt: Date; nextDoseAt: Date | null }) => {
      const vaccine: Vaccine = {
        id: createMockVaccineId(),
        name: input.name,
        appliedAt: input.appliedAt.toISOString(),
        nextDoseAt: input.nextDoseAt ? input.nextDoseAt.toISOString() : null,
      };
      setVaccines((prev) => [...prev, vaccine]);
    },
    [],
  );

  const handleDeleteVaccine = useCallback((vaccineId: string) => {
    setVaccines((prev) => prev.filter((v) => v.id !== vaccineId));
  }, []);

  const handleSaveMicrochipNumber = useCallback((microchipNumber: string | null) => {
    setDocuments((prev) => ({ ...prev, microchipNumber }));
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
  }, []);

  const handleAddTask = useCallback((values: RoutineTaskFormValues) => {
    const task: RoutineTask = {
      id: createMockRoutineTaskId(),
      title: values.title,
      description: values.description,
      frequency: values.frequency,
      dueAt: values.dueAt.toISOString(),
      completed: false,
    };
    setTasks((prev) => [...prev, task]);
  }, []);

  const handleEditTask = useCallback((taskId: string, values: RoutineTaskFormValues) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              title: values.title,
              description: values.description,
              frequency: values.frequency,
              dueAt: values.dueAt.toISOString(),
            }
          : t,
      ),
    );
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <PetProfileHeader pet={pet} onBack={onBack} onEdit={onEdit} />
      <PetProfileTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'datos' ? (
        <PetDatosTab
          pet={pet}
          onReportLost={onReportLost}
          onMarkFound={onMarkFound}
          onQrCode={onQrCode}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ) : null}

      {activeTab === 'carnet' ? (
        <PetCarnetTab
          vaccines={vaccines}
          documents={documents}
          onAddVaccine={handleAddVaccine}
          onDeleteVaccine={handleDeleteVaccine}
          onSaveMicrochipNumber={handleSaveMicrochipNumber}
        />
      ) : null}

      {activeTab === 'rutina' ? (
        <PetRutinaTab
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  scroll: { paddingBottom: spacing.xxxl },
  skeletonWrap: { flex: 1, backgroundColor: colors.backgroundApp },
  skeletonList: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: { color: colors.textPrimary, ...typography.heading, textAlign: 'center' },
  errorSubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  backBtnText: { color: colors.white, ...typography.bodyStrong },
});
