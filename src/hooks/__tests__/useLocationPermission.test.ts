import { renderHook, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

import { useLocationPermission } from '../useLocationPermission';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

describe('useLocationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refresh lee el estado de expo-location', async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as never);

    const { result } = renderHook(() => useLocationPermission());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('granted');
  });

  it('request devuelve true si se concede', async () => {
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as never);

    const { result } = renderHook(() => useLocationPermission());

    let granted = false;
    await act(async () => {
      granted = await result.current.request();
    });

    expect(granted).toBe(true);
    expect(result.current.status).toBe('granted');
  });

  it('openSettings delega en Linking', () => {
    const spy = jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
    const { result } = renderHook(() => useLocationPermission());

    act(() => {
      result.current.openSettings();
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
