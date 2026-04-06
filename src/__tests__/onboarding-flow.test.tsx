import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import OnboardingStep1Screen from '../../app/(auth)/onboarding/step-1';
import OnboardingStep2Screen from '../../app/(auth)/onboarding/step-2';
import OnboardingStep3Screen from '../../app/(auth)/onboarding/step-3';
import { usersService } from '../services/usersService';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
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

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('../services/usersService', () => ({
  usersService: {
    updateProfile: jest.fn(),
  },
}));

describe('Onboarding flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().reset();
    useAuthStore.setState({
      user: { id: 'u1', name: 'Ana García', email: 'ana@test.com' },
      isAuthenticated: true,
    });
    jest.mocked(usersService.updateProfile).mockResolvedValue({
      id: 'u1',
      name: 'Ana García',
      email: 'ana@test.com',
    });
  });

  it('step 1 muestra progreso, nombre y acciones', () => {
    const { getByTestId, getByText } = render(<OnboardingStep1Screen />);

    expect(getByTestId('onboarding.stepLabel')).toHaveTextContent('1 de 3');
    expect(getByTestId('onboarding.step1.name')).toBeTruthy();
    expect(getByText('Ana García')).toBeTruthy();
    expect(getByText('Elige una foto para tu perfil')).toBeTruthy();
    expect(getByTestId('onboarding.next')).toBeTruthy();
  });

  it('step 1: Continuar navega al paso 2', () => {
    const { getByTestId } = render(<OnboardingStep1Screen />);

    fireEvent.press(getByTestId('onboarding.next'));
    expect(mockPush).toHaveBeenCalled();
  });

  it('step 1: Omitir todo completa y reemplaza a /(app)', async () => {
    const { getByTestId } = render(<OnboardingStep1Screen />);

    fireEvent.press(getByTestId('onboarding.skipAll'));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('step 2 muestra rationale y botón de permiso', () => {
    const { getByText, getByTestId } = render(<OnboardingStep2Screen />);

    expect(getByTestId('onboarding.stepLabel')).toHaveTextContent('2 de 3');
    expect(getByText('Comparte tu ubicación')).toBeTruthy();
    expect(getByText('Mascotas perdidas en tu ciudad')).toBeTruthy();
    expect(getByTestId('onboarding.next')).toBeTruthy();
  });

  it('step 2: Atrás llama router.back', () => {
    const { getByTestId } = render(<OnboardingStep2Screen />);

    fireEvent.press(getByTestId('onboarding.back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('step 2: Omitir este paso avanza sin conceder ubicación', () => {
    const { getByText } = render(<OnboardingStep2Screen />);

    fireEvent.press(getByText('Omitir este paso'));
    expect(useOnboardingStore.getState().locationGranted).toBe(false);
    expect(mockPush).toHaveBeenCalled();
  });

  it('step 2: si el permiso es denegado, muestra explicación y enlace a ajustes', async () => {
    const Location = jest.requireMock('expo-location') as {
      requestForegroundPermissionsAsync: jest.Mock;
    };
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { getByTestId, findByTestId, getByText } = render(<OnboardingStep2Screen />);

    fireEvent.press(getByTestId('onboarding.next'));

    expect(await findByTestId('onboarding.step2.denied')).toBeTruthy();

    const openSpy = jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
    fireEvent.press(getByText('Abrir ajustes'));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('step 3: permiso concedido guarda perfil y navega al home', async () => {
    const { getByTestId } = render(<OnboardingStep3Screen />);

    fireEvent.press(getByTestId('onboarding.next'));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('step 3: denegado muestra Finalizar y puede completar', async () => {
    const Notifications = jest.requireMock('expo-notifications') as {
      requestPermissionsAsync: jest.Mock;
    };
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { getByTestId, findByTestId } = render(<OnboardingStep3Screen />);

    fireEvent.press(getByTestId('onboarding.next'));

    expect(await findByTestId('onboarding.step3.denied')).toBeTruthy();
    expect(getByTestId('onboarding.done')).toBeTruthy();

    fireEvent.press(getByTestId('onboarding.done'));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('persiste foto y flags en el PATCH al finalizar', async () => {
    useOnboardingStore.getState().setPhoto('file:///local/avatar.jpg');
    useOnboardingStore.getState().setLocationGranted(true);
    useOnboardingStore.getState().setNotificationsGranted(true);

    const { getByTestId } = render(<OnboardingStep3Screen />);

    fireEvent.press(getByTestId('onboarding.next'));

    await waitFor(() => {
      expect(usersService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUri: 'file:///local/avatar.jpg',
          locationEnabled: true,
          notificationsEnabled: true,
          name: 'Ana García',
        }),
      );
    });
  });
});
