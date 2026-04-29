import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';

import { useAuthStore } from '../../stores/authStore';

export function SentryUserSync(): null {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null;
}
