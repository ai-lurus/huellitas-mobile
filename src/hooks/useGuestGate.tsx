import React, { useState } from 'react';

import { AuthRequiredModal } from '../components/auth/AuthRequiredModal';
import { useAuthStore } from '../stores/authStore';

export interface UseGuestGateResult {
  isGuest: boolean;
  requireAuth: (action: () => void) => void;
  GuestGateModal: () => React.JSX.Element;
}

export function useGuestGate(): UseGuestGateResult {
  const isGuest = useAuthStore((s) => s.isGuest);
  const [visible, setVisible] = useState(false);

  const requireAuth = (action: () => void): void => {
    if (isGuest) {
      setVisible(true);
      return;
    }
    action();
  };

  const GuestGateModal = (): React.JSX.Element => (
    <AuthRequiredModal visible={visible} onClose={() => setVisible(false)} />
  );

  return { isGuest, requireAuth, GuestGateModal };
}
