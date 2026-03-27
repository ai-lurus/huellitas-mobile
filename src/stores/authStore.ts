import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user): void => set(() => ({ user, isAuthenticated: user !== null })),
  clearAuth: (): void => set(() => ({ user: null, isAuthenticated: false })),
}));
