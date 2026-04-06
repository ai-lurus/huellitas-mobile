import axios from 'axios';
import { z } from 'zod';

import { apiClient } from './api';

const meResponseSchema = z.object({
  isFirstLogin: z.boolean().optional(),
});

/**
 * El backend debe exponer `GET /users/me` con `{ isFirstLogin?: boolean }`
 * alineado con el login por correo. 404 se interpreta como usuario sin perfil (onboarding).
 */
export async function getPostOAuthDestination(): Promise<'onboarding' | 'app'> {
  try {
    const res = await apiClient.get<unknown>('/users/me');
    const parsed = meResponseSchema.safeParse(res.data);
    if (parsed.success && typeof parsed.data.isFirstLogin === 'boolean') {
      return parsed.data.isFirstLogin ? 'onboarding' : 'app';
    }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return 'onboarding';
    }
  }
  return 'app';
}
