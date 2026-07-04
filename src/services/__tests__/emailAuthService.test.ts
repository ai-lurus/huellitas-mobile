import { authService } from '../emailAuthService';
import { httpClient } from '../../network';
import { RATE_LIMIT_429_COPY } from '../authErrorMessages';

jest.mock('../../network', () => ({
  httpClient: {
    post: jest.fn(),
  },
}));

jest.mock('../sessionTokenStorage', () => ({
  setSessionTokenAsync: jest.fn(),
}));

function axiosError(status: number): unknown {
  return {
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: { status, data: {} },
  };
}

describe('emailAuthService.signIn error mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explica el rate limit ante 429 en vez de un error genérico', async () => {
    jest.mocked(httpClient.post).mockRejectedValueOnce(axiosError(429));

    await expect(authService.signIn('a@b.com', 'password123')).rejects.toThrow(RATE_LIMIT_429_COPY);
  });
});
