import { httpClient } from '../../network';
import { usersService } from '../usersService';

jest.mock('../../network', () => ({
  httpClient: {
    patch: jest.fn(),
  },
}));

describe('usersService.updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía JSON cuando no hay imagen local', async () => {
    jest.mocked(httpClient.patch).mockResolvedValue({
      data: { id: '1', name: 'N', email: 'n@test.com', image: null },
    });

    const user = await usersService.updateProfile({
      name: 'N',
      locationEnabled: false,
      notificationsEnabled: true,
    });

    expect(httpClient.patch).toHaveBeenCalledWith('/users/me', {
      name: 'N',
      locationEnabled: false,
      notificationsEnabled: true,
    });
    expect(user.email).toBe('n@test.com');
  });

  it('usa FormData para URI local de imagen', async () => {
    jest.mocked(httpClient.patch).mockResolvedValue({
      data: { id: '1', name: 'N', email: 'n@test.com' },
    });

    await usersService.updateProfile({
      name: 'N',
      imageUri: 'file:///tmp/x.jpg',
      locationEnabled: true,
      notificationsEnabled: false,
    });

    const [, secondArg, thirdArg] = jest.mocked(httpClient.patch).mock.calls[0] ?? [];
    expect(secondArg).toBeInstanceOf(FormData);
    expect(thirdArg).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });
});
