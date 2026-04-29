import { renderHook, act } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { usersService } from '../../services/usersService';
import { useLocationStore } from '../../stores/locationStore';
import { LOCATION_SYNC_DEBOUNCE_MS, useLocation } from '../useLocation';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  getProviderStatusAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

jest.mock('../../services/usersService', () => ({
  usersService: {
    patchMyLocation: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useLocationStore.getState().reset();
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue({ status: 'granted' } as never);
    jest.mocked(Location.getProviderStatusAsync).mockResolvedValue({
      locationServicesEnabled: true,
      backgroundModeEnabled: false,
    } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('actualiza currentLocation cuando llega una posición', async () => {
    let cb: Location.LocationCallback | undefined;
    jest.mocked(Location.watchPositionAsync).mockImplementation(async (_opts, callback) => {
      cb = callback;
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startWatching();
    });

    expect(cb).toBeDefined();
    act(() => {
      cb?.({
        coords: {
          latitude: 10,
          longitude: 20,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    expect(useLocationStore.getState().currentLocation).toEqual({ lat: 10, lng: 20 });
  });

  it('no llama al backend hasta cumplir debounce aunque supere 100m', async () => {
    let cb: Location.LocationCallback | undefined;
    jest.mocked(Location.watchPositionAsync).mockImplementation(async (_opts, callback) => {
      cb = callback;
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startWatching();
    });

    act(() => {
      cb?.({
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    expect(jest.mocked(usersService.patchMyLocation)).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(LOCATION_SYNC_DEBOUNCE_MS - 1);
    });
    expect(jest.mocked(usersService.patchMyLocation)).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2);
    });

    expect(jest.mocked(usersService.patchMyLocation)).toHaveBeenCalledWith({
      lat: 40.4168,
      lng: -3.7038,
    });
  });

  it('detiene la suscripción y limpia debounce al llamar stopWatching', async () => {
    const remove = jest.fn();
    let cb: Location.LocationCallback | undefined;
    jest.mocked(Location.watchPositionAsync).mockImplementation(async (_opts, callback) => {
      cb = callback;
      return { remove } as unknown as Location.LocationSubscription;
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startWatching();
    });

    act(() => {
      cb?.({
        coords: {
          latitude: 1,
          longitude: 1,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    act(() => {
      result.current.stopWatching();
    });

    expect(remove).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(LOCATION_SYNC_DEBOUNCE_MS + 1);
    });

    expect(jest.mocked(usersService.patchMyLocation)).not.toHaveBeenCalled();
  });

  it('no programa envío al backend si el movimiento es < 100m respecto al último sync', async () => {
    useLocationStore.getState().setLastSyncedLocation({ lat: 40.4168, lng: -3.7038 });

    let cb: Location.LocationCallback | undefined;
    jest.mocked(Location.watchPositionAsync).mockImplementation(async (_opts, callback) => {
      cb = callback;
      return { remove: jest.fn() } as unknown as Location.LocationSubscription;
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startWatching();
    });

    act(() => {
      cb?.({
        coords: {
          latitude: 40.417,
          longitude: -3.7038,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    act(() => {
      jest.advanceTimersByTime(LOCATION_SYNC_DEBOUNCE_MS + 1);
    });

    expect(jest.mocked(usersService.patchMyLocation)).not.toHaveBeenCalled();
  });

  it('expone mensaje si los servicios de ubicación están desactivados', async () => {
    jest.mocked(Location.getProviderStatusAsync).mockResolvedValue({
      locationServicesEnabled: false,
      backgroundModeEnabled: false,
    } as never);

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.startWatching();
    });

    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(useLocationStore.getState().locationError).toContain('GPS');
  });
});
