import { act, renderHook } from '@testing-library/react-native';

import { useGuestGate } from './useGuestGate';
import { useAuthStore } from '../stores/authStore';

describe('useGuestGate', () => {
  beforeEach(() => {
    useAuthStore.setState({ isGuest: false });
  });

  it('ejecuta la acción de inmediato cuando isGuest es false', () => {
    const { result } = renderHook(() => useGuestGate());
    const action = jest.fn();

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta la acción cuando isGuest es true', () => {
    useAuthStore.setState({ isGuest: true });
    const { result } = renderHook(() => useGuestGate());
    const action = jest.fn();

    act(() => {
      result.current.requireAuth(action);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it('expone isGuest reflejando el estado del store', () => {
    useAuthStore.setState({ isGuest: true });
    const { result } = renderHook(() => useGuestGate());

    expect(result.current.isGuest).toBe(true);
  });
});
