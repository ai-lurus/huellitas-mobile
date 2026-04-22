import axios from 'axios';
import { z } from 'zod';

import { httpClient } from '../network';

const meResponseSchema = z.object({
  isFirstLogin: z.boolean().optional(),
  /** Alternativa al nombre anterior: usuario debe completar onboarding. */
  needsOnboarding: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

/**
 * Tras OAuth (Google), decide si ir al onboarding de 3 pasos o al home.
 *
 * El API debe responder en `GET /users/me` al menos una de:
 * - `isFirstLogin: true` → onboarding (recomendado, alineado con email)
 * - `needsOnboarding: true` → onboarding
 * - `onboardingCompleted: false` → onboarding
 *
 * Si no hay flags y la respuesta es 200 → se asume usuario ya configurado → app.
 * 404 → onboarding (perfil aún no creado / usuario nuevo).
 */
export async function getPostOAuthDestination(): Promise<'onboarding' | 'app'> {
  try {
    const res = await httpClient.get<unknown>('/users/me');
    const parsed = meResponseSchema.safeParse(res.data);
    if (!parsed.success) {
      return 'app';
    }
    const d = parsed.data;
    if (d.needsOnboarding === true) return 'onboarding';
    if (d.onboardingCompleted === false) return 'onboarding';
    if (typeof d.isFirstLogin === 'boolean') {
      return d.isFirstLogin ? 'onboarding' : 'app';
    }
    return 'app';
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return 'onboarding';
    }
  }
  return 'app';
}
