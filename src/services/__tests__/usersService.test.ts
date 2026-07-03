import { httpClient } from '../../network';
import { usersService } from '../usersService';

jest.mock('../../network', () => ({
  httpClient: {
    patch: jest.fn(),
  },
}));

describe('usersService.patchMyLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía PATCH a /users/me/location', async () => {
    jest.mocked(httpClient.patch).mockResolvedValue({ data: {} });

    await usersService.patchMyLocation({ lat: 40.4, lng: -3.7 });

    expect(httpClient.patch).toHaveBeenCalledWith('/users/me/location', { lat: 40.4, lng: -3.7 });
  });
});

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

describe('usersService.updateAccountProfile (§7.2 Mi perfil)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envía nombre, correo y teléfono en el PATCH', async () => {
    jest.mocked(httpClient.patch).mockResolvedValue({
      data: { id: '1', name: 'Nueva', email: 'nueva@test.com', phone: '5512345678' },
    });

    const user = await usersService.updateAccountProfile({
      name: 'Nueva',
      email: 'nueva@test.com',
      phone: '5512345678',
    });

    expect(httpClient.patch).toHaveBeenCalledWith('/users/me', {
      name: 'Nueva',
      email: 'nueva@test.com',
      phone: '5512345678',
    });
    expect(user.phone).toBe('5512345678');
  });

  it('lanza "Este correo ya está en uso" cuando el backend responde 409', async () => {
    jest.mocked(httpClient.patch).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    });

    await expect(
      usersService.updateAccountProfile({ email: 'duplicado@test.com' }),
    ).rejects.toThrow('Este correo ya está en uso');
  });
});
