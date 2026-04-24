import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Pet } from '../domain/pets';
import type { CreatePetDto } from '../services/petsService';
import { petsService } from '../services/petsService';
import type { PetFormSubmitPayload } from '../components/pets/PetForm';

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

function usePetsQuery() {
  return useQuery({
    queryKey: PETS_QUERY_KEY,
    queryFn: () => petsService.listPets(),
    staleTime: 15000,
  });
}

function useDeletePetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => petsService.deletePet(petId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}

export function usePet(petId: string) {
  return useQuery({
    queryKey: petQueryKey(petId),
    queryFn: () => petsService.getPet(petId),
    enabled: Boolean(petId),
    staleTime: 15000,
  });
}

export function useUpdatePetMutation(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PetFormSubmitPayload) =>
      petsService.updatePet(petId, {
        name: data.name,
        species: data.species,
        sex: data.sex,
        breed: data.breed,
        color: data.color,
        age: data.age,
        notes: data.notes,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: petQueryKey(petId) }),
      ]);
    },
  });
}

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
        await Promise.all(photos.slice(0, 5).map((uri) => petsService.uploadPetPhoto(pet.id, uri)));
      }
      return pet;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
  });
}
