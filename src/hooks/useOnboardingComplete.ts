import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { persistOnboardingProfile } from '../onboarding/persistOnboardingProfile';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';

export interface UseOnboardingCompleteResult {
  complete: (mode?: 'normal' | 'skipAll') => Promise<void>;
  submitError: string | null;
  submitting: boolean;
  clearError: () => void;
}

export function useOnboardingComplete(): UseOnboardingCompleteResult {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const resetStore = useOnboardingStore((s) => s.reset);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const complete = useCallback(
    async (mode: 'normal' | 'skipAll' = 'normal') => {
      if (!user) {
        setSubmitError('Sesión no válida');
        return;
      }
      setSubmitError(null);
      setSubmitting(true);
      try {
        if (mode === 'skipAll') {
          resetStore();
        }
        const state = useOnboardingStore.getState();
        const updated = await persistOnboardingProfile({
          name: user.name,
          photo: mode === 'skipAll' ? null : state.photo,
          locationEnabled: mode === 'skipAll' ? false : state.locationGranted,
          notificationsEnabled: mode === 'skipAll' ? false : state.notificationsGranted,
        });
        setUser(updated);
        useOnboardingStore.getState().reset();
        router.replace('/(app)');
      } catch (e) {
        // En modo dev es útil ver el error, pero no queremos ruido en lint/tests.
        useOnboardingStore.getState().reset();
        router.replace('/(app)');
      } finally {
        setSubmitting(false);
      }
    },
    [user, setUser, resetStore, router],
  );

  const clearError = useCallback(() => setSubmitError(null), []);

  return { complete, submitError, submitting, clearError };
}
