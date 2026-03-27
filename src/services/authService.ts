import { z } from 'zod';
import * as SecureStore from 'expo-secure-store';

import { apiClient, SESSION_TOKEN_KEY } from './api';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().url().optional(),
});

const signInResponseSchema = z.object({
  token: z.string().min(1).optional(),
  user: userSchema,
  isFirstLogin: z.boolean().default(false),
});

export type AuthUser = z.infer<typeof userSchema>;

async function signIn(
  email: string,
  password: string,
): Promise<{
  user: AuthUser;
  isFirstLogin: boolean;
}> {
  try {
    const res = await apiClient.post('/auth/sign-in', { email, password });
    const parsed = signInResponseSchema.parse(res.data);

    if (parsed.token) {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, parsed.token);
    }

    return { user: parsed.user, isFirstLogin: parsed.isFirstLogin };
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
    throw new Error('Something went wrong');
  }
}

export const authService = {
  signIn,
};
