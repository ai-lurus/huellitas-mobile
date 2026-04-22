import { formatOAuthErrorMessage } from '../auth.service';

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn(() => ({
    signIn: { social: jest.fn() },
    getSession: jest.fn(),
  })),
}));

jest.mock('@better-auth/expo/client', () => ({
  expoClient: jest.fn(() => ({ id: 'expo', getActions: () => ({}), fetchPlugins: [] })),
}));

jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../config/env', () => ({
  env: {
    EXPO_PUBLIC_API_URL: 'http://localhost:3000',
    EXPO_PUBLIC_MAP_API_KEY: 'x',
    EXPO_PUBLIC_BETTER_AUTH_URL: 'http://localhost:3000/api/auth',
    EXPO_PUBLIC_OAUTH_CALLBACK_PATH: 'http://localhost:8081/auth/callback',
    EXPO_PUBLIC_ENV: 'development',
  },
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: { getState: () => ({ setUser: jest.fn() }) },
}));

jest.mock('../postOAuthRouting', () => ({
  getPostOAuthDestination: jest.fn().mockResolvedValue('app'),
}));

describe('auth.service OAuth helpers', () => {
  it('formatOAuthErrorMessage devuelve mensaje genérico para errores desconocidos', () => {
    expect(formatOAuthErrorMessage(null)).toMatch(/Google/);
  });

  it('formatOAuthErrorMessage propaga el mensaje de Error', () => {
    expect(formatOAuthErrorMessage(new Error('Red no disponible'))).toBe('Red no disponible');
  });

  it('formatOAuthErrorMessage explica trustedOrigins ante 403', () => {
    expect(formatOAuthErrorMessage({ status: 403 })).toMatch(/trustedOrigins/);
  });

  it('formatOAuthErrorMessage explica rate limit ante 429', () => {
    expect(formatOAuthErrorMessage({ status: 429 })).toMatch(/429/);
  });
});
