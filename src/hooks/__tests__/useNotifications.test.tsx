import React from 'react';
import { AppState } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import * as Sentry from '@sentry/react-native';
import { STORAGE_KEY_PUSH_LAST_EXPO_TOKEN } from '../../config/constants';
import { notificationsService } from '../../services/notificationsService';
import { useAuthStore } from '../../stores/authStore';
import { useNotifications } from '../useNotifications';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]): void => mockRouterPush(...args),
    replace: (...args: unknown[]): void => mockRouterReplace(...args),
  },
}));

jest.mock('@sentry/react-native', () => ({
  captureMessage: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock('../../services/notificationsService', () => ({
  notificationsService: {
    registerPushToken: jest.fn(() => Promise.resolve()),
    deletePushToken: jest.fn(() => Promise.resolve()),
    clearStoredExpoPushToken: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  easConfig: { projectId: 'test-project-id' },
}));

const asyncStorageStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(asyncStorageStore[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      asyncStorageStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete asyncStorageStore[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' }),
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[unit-test]', type: 'expo' }),
  ),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

function TestHost(): null {
  useNotifications();
  return null;
}

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(asyncStorageStore).forEach((k) => delete asyncStorageStore[k]);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('registra el token en backend tras permiso concedido cuando el token cambia', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    render(<TestHost />);

    await waitFor(() => {
      expect(notificationsService.registerPushToken).toHaveBeenCalledWith({
        token: 'ExponentPushToken[unit-test]',
        platform: 'ios',
      });
    });

    expect(asyncStorageStore[STORAGE_KEY_PUSH_LAST_EXPO_TOKEN]).toBe(
      'ExponentPushToken[unit-test]',
    );
  });

  it('navega al reporte al pulsar una notificación con reportId', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    const Notifications =
      jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
    let responseHandler: ((response: unknown) => void) | undefined;
    jest.mocked(Notifications.addNotificationResponseReceivedListener).mockImplementation((cb) => {
      responseHandler = cb as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    render(<TestHost />);

    await waitFor(() => {
      expect(jest.mocked(Notifications.addNotificationResponseReceivedListener)).toHaveBeenCalled();
    });

    if (responseHandler != null) {
      responseHandler({
        notification: {
          request: {
            content: {
              data: { reportId: 'rep_99' },
              title: 'T',
              body: 'B',
            },
          },
        },
      });
    }

    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/reports/rep_99');
  });

  it('tap en background navega al reporte correcto', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    const Notifications =
      jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
    let responseHandler: ((response: unknown) => void) | undefined;
    jest.mocked(Notifications.addNotificationResponseReceivedListener).mockImplementation((cb) => {
      responseHandler = cb as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    render(<TestHost />);

    await waitFor(() => {
      expect(jest.mocked(Notifications.addNotificationResponseReceivedListener)).toHaveBeenCalled();
    });

    responseHandler?.({
      notification: {
        request: {
          content: {
            data: { reportId: 'rep_bg' },
          },
        },
      },
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/reports/rep_bg');
  });

  it('tap en app cerrada usa getLastNotificationResponseAsync y navega', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    const Notifications =
      jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
    jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValueOnce({
      notification: {
        request: {
          content: {
            data: { reportId: 'rep_closed' },
          },
        },
      },
    } as unknown as Awaited<ReturnType<typeof Notifications.getLastNotificationResponseAsync>>);

    render(<TestHost />);

    await waitFor(() => {
      expect(jest.mocked(Notifications.getLastNotificationResponseAsync)).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/(app)/reports/rep_closed');
    });
  });

  it('payload inválido redirige a inicio y reporta a Sentry', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    const Notifications =
      jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
    let responseHandler: ((response: unknown) => void) | undefined;
    jest.mocked(Notifications.addNotificationResponseReceivedListener).mockImplementation((cb) => {
      responseHandler = cb as (response: unknown) => void;
      return { remove: jest.fn() };
    });

    render(<TestHost />);

    await waitFor(() => {
      expect(jest.mocked(Notifications.addNotificationResponseReceivedListener)).toHaveBeenCalled();
    });

    responseHandler?.({
      notification: {
        request: {
          content: {
            data: {},
          },
        },
      },
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)');
    expect(jest.mocked(Sentry.captureMessage)).toHaveBeenCalled();
  });

  it('re-sincroniza el token al volver la app a activa', async () => {
    useAuthStore.setState({
      user: { id: 'u1', name: 'A', email: 'a@test.com' },
      isAuthenticated: true,
    });

    const subs: { change?: (s: string) => void } = {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, cb) => {
      if (event === 'change') subs.change = cb as (s: string) => void;
      return { remove: jest.fn() };
    });

    render(<TestHost />);

    await waitFor(() => {
      expect(notificationsService.registerPushToken).toHaveBeenCalledTimes(1);
    });

    jest.clearAllMocks();
    asyncStorageStore[STORAGE_KEY_PUSH_LAST_EXPO_TOKEN] = 'ExponentPushToken[unit-test]';

    subs.change?.('active');

    await waitFor(() => {
      expect(notificationsService.registerPushToken).not.toHaveBeenCalled();
    });

    const NotificationsMod =
      jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
    jest.mocked(NotificationsMod.getExpoPushTokenAsync).mockResolvedValueOnce({
      data: 'ExponentPushToken[nuevo]',
      type: 'expo',
    });

    subs.change?.('active');

    await waitFor(() => {
      expect(notificationsService.registerPushToken).toHaveBeenCalledWith({
        token: 'ExponentPushToken[nuevo]',
        platform: 'ios',
      });
    });

    jest.mocked(AppState.addEventListener).mockRestore();
  });
});
