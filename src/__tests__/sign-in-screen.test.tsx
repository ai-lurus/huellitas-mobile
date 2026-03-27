import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

import SignInScreen from '../../app/(auth)/sign-in';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock('../services/authService', () => ({
  authService: {
    signIn: jest.fn(),
  },
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn() }),
  },
}));

const { authService } = jest.requireMock('../services/authService') as {
  authService: { signIn: jest.Mock };
};

describe('SignInScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('navigates to /(app) on success', async () => {
    authService.signIn.mockResolvedValueOnce({
      user: { id: '1', name: 'Test', email: 'a@b.com' },
      isFirstLogin: false,
    });

    const { getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('navega a onboarding en el primer inicio de sesión', async () => {
    authService.signIn.mockResolvedValueOnce({
      user: { id: '1', name: 'Test', email: 'a@b.com' },
      isFirstLogin: true,
    });

    const { getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('abre el flujo OAuth al pulsar Iniciar sesión con Google', () => {
    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.google'));

    expect(mockPush).toHaveBeenCalledWith('/(auth)/oauth/google');
  });

  it('abre el flujo OAuth al pulsar Continuar con Apple', () => {
    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.apple'));

    expect(mockPush).toHaveBeenCalledWith('/(auth)/oauth/apple');
  });
});
