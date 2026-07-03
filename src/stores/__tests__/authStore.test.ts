import { useAuthStore } from '../authStore';

describe('useAuthStore — guest mode', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isGuest: false });
  });

  it('isGuest es false por defecto', () => {
    expect(useAuthStore.getState().isGuest).toBe(false);
  });

  it('enterGuestMode pone isGuest en true', () => {
    useAuthStore.getState().enterGuestMode();
    expect(useAuthStore.getState().isGuest).toBe(true);
  });

  it('clearAuth resetea isGuest a false junto con user e isAuthenticated', () => {
    useAuthStore.getState().enterGuestMode();
    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().isGuest).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('setUser resetea isGuest a false (un invitado que inicia sesión deja de ser invitado)', () => {
    useAuthStore.getState().enterGuestMode();
    useAuthStore.getState().setUser({ id: 'u1', name: 'Ana', email: 'ana@test.com' });

    expect(useAuthStore.getState().isGuest).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
