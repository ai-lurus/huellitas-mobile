import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Pet } from '../domain/pets';
import type { CreatePetDto } from '../services/petsService';
import { petsService } from '../services/petsService';
import type { PetFormSubmitPayload } from '../components/pets/PetForm';

/** URIs que aún no están en el servidor y deben subirse con `uploadPetPhoto`. */
function isLocalPetPhotoUri(uri: string): boolean {
  const s = uri.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  return (
    lower.startsWith('file:') ||
    lower.startsWith('content:') ||
    lower.startsWith('ph://') ||
    lower.startsWith('assets-library://')
  );
}

export const PETS_QUERY_KEY = ['pets'] as const;
export const petQueryKey = (id: string) => ['pets', id] as const;

export function usePets(): {
  /** API “simple” para pantallas (según ticket). */
  pets: ReturnType<typeof usePetsQuery>['data'];
  isLoading: boolean;
  refetch: ReturnType<typeof usePetsQuery>['refetch'];
  deleteMutation: ReturnType<typeof useDeletePetMutation>;

  /** API extendida (compatibilidad con pantallas existentes). */
  createPetMutation: ReturnType<typeof useCreatePetMutation>;
  petsQuery: ReturnType<typeof usePetsQuery>;
  deletePetMutation: ReturnType<typeof useDeletePetMutation>;
} {
  const petsQuery = usePetsQuery();
  const deletePetMutation = useDeletePetMutation();
  return {
    pets: petsQuery.data ?? [],
    isLoading: petsQuery.isPending,
    refetch: petsQuery.refetch,
    deleteMutation: deletePetMutation,

    createPetMutation: useCreatePetMutation(),
    petsQuery,
    deletePetMutation,
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function usePetsQuery() {
  return useQuery({
    queryKey: PETS_QUERY_KEY,
    queryFn: () => petsService.listPets(),
    staleTime: 15000,
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useDeletePetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => petsService.deletePet(petId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function usePet(petId: string) {
  return useQuery({
    queryKey: petQueryKey(petId),
    queryFn: () => petsService.getPet(petId),
    enabled: Boolean(petId),
    staleTime: 15000,
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUpdatePetMutation(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PetFormSubmitPayload): Promise<Pet> => {
      await petsService.updatePet(petId, {
        name: data.name,
        species: data.species,
        sex: data.sex,
        breed: data.breed,
        color: data.color,
        age: data.age,
        notes: data.notes,
      });
      const photos = data.photos ?? [];
      const localUris = photos.filter(isLocalPetPhotoUri).slice(0, 5);
      if (localUris.length > 0) {
        try {
          await Promise.all(localUris.map((uri) => petsService.uploadPetPhoto(petId, uri)));
        } catch {
          throw new Error('No se pudo subir la foto. Por favor intentá de nuevo.');
        }
      }
      return petsService.getPet(petId);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: petQueryKey(petId) }),
      ]);
    },
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useCreatePetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PetFormSubmitPayload): Promise<Pet> => {
      const dto: CreatePetDto = {
        name: data.name,
        species: data.species,
        sex: data.sex,
        breed: data.breed,
        color: data.color,
        age: data.age,
        notes: data.notes,
      };

      const pet = await petsService.createPet(dto);
      const photos = data.photos ?? [];
      if (photos.length > 0) {
        try {
          await Promise.all(
            photos.slice(0, 5).map((uri) => petsService.uploadPetPhoto(pet.id, uri)),
          );
        } catch {
          try {
            await petsService.deletePet(pet.id);
          } catch {
            // best-effort rollback
          }
          throw new Error('No se pudo subir la foto. Por favor intentá de nuevo.');
        }
      }
      return petsService.getPet(pet.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}
