import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { PublicUserProfile } from '../domain/userProfile';
import { usersService } from '../services/usersService';

export const USER_PROFILE_QUERY_KEY = 'user-profile' as const;

const userProfileQueryKey = (id: string) => [USER_PROFILE_QUERY_KEY, id] as const;

export function useUserProfile(userId: string): UseQueryResult<PublicUserProfile> {
  return useQuery({
    queryKey: userProfileQueryKey(userId),
    queryFn: () => usersService.getUserPublicProfile(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: 1,
  });
}
