import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  enterGuestMode: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  setUser: (user): void => set(() => ({ user, isAuthenticated: user !== null })),
  clearAuth: (): void => set(() => ({ user: null, isAuthenticated: false, isGuest: false })),
  enterGuestMode: (): void => set(() => ({ isGuest: true })),
}));
