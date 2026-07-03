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
});
