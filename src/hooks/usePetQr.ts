import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { PetPublic } from '../domain/pets';
import { petQrService } from '../services/petQrService';

const QR_TOKEN_KEY = (petId: string) => ['pet-qr', petId] as const;
const PUBLIC_PROFILE_KEY = (qrToken: string) => ['pet-public', qrToken] as const;

export function usePetQrToken(petId: string): UseQueryResult<string> {
  return useQuery({
    queryKey: QR_TOKEN_KEY(petId),
    queryFn: () => petQrService.getQrToken(petId),
    enabled: Boolean(petId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRotateQrToken(petId: string): UseMutationResult<string, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => petQrService.rotateQrToken(petId),
    onSuccess: (newToken) => {
      queryClient.setQueryData(QR_TOKEN_KEY(petId), newToken);
    },
  });
}

export function usePublicPetProfile(qrToken: string): UseQueryResult<PetPublic> {
  return useQuery({
    queryKey: PUBLIC_PROFILE_KEY(qrToken),
    queryFn: () => petQrService.getPublicProfile(qrToken),
    enabled: Boolean(qrToken),
    staleTime: 2 * 60 * 1000,
  });
}
