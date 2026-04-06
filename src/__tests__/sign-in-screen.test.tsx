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

jest.mock('../services/authService');

jest.mock('../services/auth.service', () => ({
  runGoogleSignInFlow: jest.fn(),
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn() }),
  },
}));

const { authService } = jest.requireMock('../services/authService') as {
  authService: { signIn: jest.Mock };
};

const { runGoogleSignInFlow } = jest.requireMock('../services/auth.service') as {
  runGoogleSignInFlow: jest.Mock;
};

describe('SignInScreen', () => {
  jest.setTimeout(25000);

  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
    runGoogleSignInFlow.mockReset();
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

  it('ejecuta el flujo OAuth de Google y navega al home', async () => {
    runGoogleSignInFlow.mockResolvedValueOnce({
      result: { status: 'success' },
      navigateTo: '/(app)',
    });

    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.google'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(app)');
    });
  });

  it('no navega si el usuario cancela Google OAuth', async () => {
    runGoogleSignInFlow.mockResolvedValueOnce({
      result: { status: 'cancelled' },
      navigateTo: null,
    });

    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.google'));

    await waitFor(() => {
      expect(runGoogleSignInFlow).toHaveBeenCalled();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('navega a onboarding tras Google OAuth cuando el backend indica primer acceso', async () => {
    runGoogleSignInFlow.mockResolvedValueOnce({
      result: { status: 'success' },
      navigateTo: '/onboarding',
    });

    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.google'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('abre el flujo OAuth al pulsar Continuar con Apple', () => {
    const { getByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId('signIn.apple'));

    expect(mockPush).toHaveBeenCalledWith('/(auth)/oauth/apple');
  });
});
