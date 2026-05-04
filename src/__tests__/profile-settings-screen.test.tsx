import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../../app/(app)/profile/settings';
import { notificationsService } from '../services/notificationsService';
import { usersService } from '../services/usersService';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'file:///tmp/photo.jpg' }] }),
  ),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '2.4.1' },
  nativeAppVersion: '2.4.1',
}));

jest.mock('@react-native-community/slider', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return function MockSlider(
    props: Record<string, unknown> & { testID?: string },
  ): React.JSX.Element {
    return React.createElement(View, props);
  };
});

jest.mock('../services/usersService', () => ({
  usersService: {
    patchSettings: jest.fn(),
    deleteAccount: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../services/notificationsService', () => ({
  notificationsService: {
    deletePushToken: jest.fn(() => Promise.resolve()),
    clearStoredExpoPushToken: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../services/sessionTokenStorage', () => ({
  deleteSessionTokenAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/auth.service', () => ({
  authClient: { signOut: jest.fn(() => Promise.resolve()) },
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'u1', name: 'Ana García', email: 'ana@test.com' },
      isAuthenticated: true,
    });
    useSettingsStore.setState({
      alertRadiusKm: 3,
      alertsEnabled: true,
      pushNotificationsEnabled: true,
      emailAlertsEnabled: false,
    });
    jest.useFakeTimers();
    jest.mocked(usersService.patchSettings).mockResolvedValue({
      alertRadiusKm: 3,
      alertsEnabled: true,
      pushNotificationsEnabled: true,
      emailAlertsEnabled: false,
    });
    jest.mocked(usersService.updateProfile).mockResolvedValue({
      id: 'u1',
      name: 'Ana García',
      email: 'ana@test.com',
      image: 'https://example.com/a.jpg',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza y muestra email (solo lectura)', () => {
    const { getByTestId } = render(<SettingsScreen />);
    expect(getByTestId('settings.screen')).toBeTruthy();
    expect(getByTestId('settings.email')).toHaveTextContent('ana@test.com');
  });

  it('cambiar slider actualiza el store', () => {
    const { getByTestId } = render(<SettingsScreen />);
    const slider = getByTestId('settings.alertRadius');
    fireEvent(slider, 'valueChange', 7);
    expect(useSettingsStore.getState().alertRadiusKm).toBe(7);
  });

  it('toggle dispara PATCH (debounce 500ms)', async () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent(getByTestId('settings.alertsEnabled'), 'valueChange', false);

    expect(usersService.patchSettings).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(usersService.patchSettings).toHaveBeenCalledWith({
        alertRadiusKm: 3,
        alertsEnabled: false,
        notificationsEnabled: true,
        emailAlertsEnabled: false,
      });
    });
  });

  it('logout confirma y navega a sign-in', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const btns = (buttons ?? []) as Array<{ style?: string; onPress?: () => void }>;
      const destructive = btns.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings.logout'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
      expect(notificationsService.deletePushToken).toHaveBeenCalled();
      expect(notificationsService.clearStoredExpoPushToken).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it('delete account requiere escribir DELETE y luego sign out', async () => {
    jest.mocked(usersService.deleteAccount).mockResolvedValueOnce(undefined);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings.deleteAccount'));

    fireEvent.changeText(getByTestId('settings.deleteConfirmInput'), 'DELETE');
    fireEvent.press(getByTestId('settings.deleteConfirm'));

    await waitFor(() => {
      expect(usersService.deleteAccount).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
    });
  });
});
