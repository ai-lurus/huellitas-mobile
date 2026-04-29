import { httpClient } from '../../network';
import { notificationsService } from '../notificationsService';

jest.mock('../../network', () => ({
  httpClient: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

describe('notificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerPushToken hace POST a /api/v1/users/me/push-token', async () => {
    jest.mocked(httpClient.post).mockResolvedValueOnce({ data: {} });

    await notificationsService.registerPushToken({
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/api/v1/users/me/push-token', {
      token: 'ExponentPushToken[abc]',
      platform: 'ios',
    });
  });

  it('deletePushToken hace DELETE al mismo path', async () => {
    jest.mocked(httpClient.delete).mockResolvedValueOnce({ data: {} });

    await notificationsService.deletePushToken();

    expect(httpClient.delete).toHaveBeenCalledWith('/api/v1/users/me/push-token');
  });
});
