import { renderHook, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

import { useLocationPermission } from '../useLocationPermission';

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
}));

describe('useLocationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'undetermined' } as never);
    jest
      .mocked(Location.getBackgroundPermissionsAsync)
      .mockResolvedValue({ status: 'undetermined' } as never);
  });

  it('refresh lee primer y segundo plano', async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as never);
    jest
      .mocked(Location.getBackgroundPermissionsAsync)
      .mockResolvedValue({ status: 'denied' } as never);

    const { result } = renderHook(() => useLocationPermission());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.foregroundStatus).toBe('granted');
    expect(result.current.backgroundStatus).toBe('denied');
    expect(result.current.status).toBe('granted');
  });

  it('request devuelve true si se concede en primer plano', async () => {
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as never);

    const { result } = renderHook(() => useLocationPermission());

    let granted = false;
    await act(async () => {
      granted = await result.current.request();
    });

    expect(granted).toBe(true);
    expect(result.current.foregroundStatus).toBe('granted');
  });

  it('requestBackgroundWithExplanation solicita permiso al pulsar Continuar', async () => {
    jest.mocked(Location.requestBackgroundPermissionsAsync).mockResolvedValue({
      status: 'granted',
    } as never);

    const alertSpy = jest.spyOn(Alert, 'alert');

    const { result } = renderHook(() => useLocationPermission());

    let res: { granted: boolean; declinedExplanationDialog: boolean } | undefined;
    await act(async () => {
      const p = result.current.requestBackgroundWithExplanation();
      expect(alertSpy).toHaveBeenCalled();
      const buttons = alertSpy.mock.calls[0]?.[2] as
        | { text?: string; onPress?: () => void }[]
        | undefined;
      const continuar = buttons?.find((b) => b.text === 'Continuar');
      continuar?.onPress?.();
      res = await p;
    });

    expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    expect(res).toEqual({ granted: true, declinedExplanationDialog: false });
    alertSpy.mockRestore();
  });

  it('requestBackgroundWithExplanation marca diálogo declinado en Ahora no', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { result } = renderHook(() => useLocationPermission());

    let res: { granted: boolean; declinedExplanationDialog: boolean } | undefined;
    await act(async () => {
      const p = result.current.requestBackgroundWithExplanation();
      const buttons = alertSpy.mock.calls[0]?.[2] as
        | { text?: string; onPress?: () => void }[]
        | undefined;
      const ahoraNo = buttons?.find((b) => b.text === 'Ahora no');
      ahoraNo?.onPress?.();
      res = await p;
    });

    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(res).toEqual({ granted: false, declinedExplanationDialog: true });
    alertSpy.mockRestore();
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
