import { renderHook, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { useNotificationPermission } from '../useNotificationPermission';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

describe('useNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refresh lee el estado de expo-notifications', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as never);

    const { result } = renderHook(() => useNotificationPermission());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('denied');
  });

  it('request devuelve false si se deniega', async () => {
    jest
      .mocked(Notifications.requestPermissionsAsync)
      .mockResolvedValue({ status: 'denied' } as never);

    const { result } = renderHook(() => useNotificationPermission());

    let granted = true;
    await act(async () => {
      granted = await result.current.request();
    });

    expect(granted).toBe(false);
    expect(result.current.status).toBe('denied');
  });

  it('openSettings delega en Linking', () => {
    const spy = jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
    const { result } = renderHook(() => useNotificationPermission());

    act(() => {
      result.current.openSettings();
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
