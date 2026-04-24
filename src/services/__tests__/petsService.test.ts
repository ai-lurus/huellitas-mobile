import { httpClient } from '../../network';
import { petsService } from '../petsService';

jest.mock('../../network', () => ({
  httpClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('petsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPet', () => {
    it('POST /api/v1/pets con el payload', async () => {
      jest.mocked(httpClient.post).mockResolvedValueOnce({
        data: { id: 'pet_1', name: 'Max', species: 'dog', sex: 'male' },
      });

      const pet = await petsService.createPet({
        name: 'Max',
        species: 'dog',
        sex: 'male',
        breed: 'Golden',
        color: 'Dorado',
        age: 3,
        notes: 'ok',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/api/v1/pets', {
        name: 'Max',
        species: 'dog',
        sex: 'male',
        breed: 'Golden',
        color: 'Dorado',
        age: 3,
        notes: 'ok',
      });
      expect(pet.id).toBe('pet_1');
    });

    it('acepta respuesta envuelta en { data: { ... } }', async () => {
      jest.mocked(httpClient.post).mockResolvedValueOnce({
        data: { data: { id: 'pet_2', name: 'Luna', species: 'cat', sex: 'female' } },
      });

      const pet = await petsService.createPet({
        name: 'Luna',
        species: 'cat',
        sex: 'female',
      });

      expect(pet.id).toBe('pet_2');
    });
  });

  describe('listPets', () => {
    it('GET /api/v1/pets y parsea array', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({
        data: [{ id: '1', name: 'Max', species: 'dog' }],
      });

      const list = await petsService.listPets();
      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/pets');
      expect(list).toHaveLength(1);
      expect(list[0]?.name).toBe('Max');
    });

    it('devuelve [] si la respuesta no es un array', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({ data: {} });
      await expect(petsService.listPets()).resolves.toEqual([]);
    });

    it('mapea photoUrl desde images[{url}] cuando el backend no manda photoUrl', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({
        data: [
          {
            id: '1',
            name: 'Luna',
            species: 'cat',
            images: [{ url: 'https://cdn.test/a.jpg' }, { url: 'https://cdn.test/b.jpg' }],
          },
        ],
      });

      const list = await petsService.listPets();
      expect(list[0]?.photoUrl).toBe('https://cdn.test/a.jpg');
    });
  });

  describe('getPet', () => {
    it('normaliza photos desde images[{url}]', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({
        data: {
          id: 'pet_1',
          name: 'Luna',
          species: 'cat',
          sex: 'female',
          images: [{ url: 'https://cdn.test/a.jpg' }, { url: 'https://cdn.test/b.jpg' }],
        },
      });

      const pet = await petsService.getPet('pet_1');
      expect(pet.photos).toEqual(['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg']);
    });
  });

  describe('updatePet', () => {
    it('PATCH /api/v1/pets/:id con el payload', async () => {
      jest.mocked(httpClient.patch).mockResolvedValueOnce({
        data: { id: 'pet_1', name: 'Max', species: 'dog', sex: 'male' },
      });

      const pet = await petsService.updatePet('pet_1', {
        name: 'Max',
        species: 'dog',
        sex: 'male',
        breed: 'Golden',
        color: 'Dorado',
        age: 3,
        notes: 'ok',
      });

      expect(httpClient.patch).toHaveBeenCalledWith('/api/v1/pets/pet_1', {
        name: 'Max',
        species: 'dog',
        sex: 'male',
        breed: 'Golden',
        color: 'Dorado',
        age: 3,
        notes: 'ok',
      });
      expect(pet.id).toBe('pet_1');
    });
  });

  describe('deletePet', () => {
    it('DELETE /api/v1/pets/:id', async () => {
      jest.mocked(httpClient.delete).mockResolvedValueOnce({ data: {} });
      await petsService.deletePet('pet_1');
      expect(httpClient.delete).toHaveBeenCalledWith('/api/v1/pets/pet_1');
    });
  });

  describe('uploadPetPhoto', () => {
    it('envía FormData a /api/v1/pets/:id/photos', async () => {
      jest.mocked(httpClient.post).mockResolvedValueOnce({
        data: { url: 'https://cdn.test/photo.jpg' },
      });

      const url = await petsService.uploadPetPhoto('pet_1', 'file:///tmp/photo.jpg');
      expect(url).toBe('https://cdn.test/photo.jpg');

      const [path, body, config] = jest.mocked(httpClient.post).mock.calls[0] ?? [];
      expect(path).toBe('/api/v1/pets/pet_1/photos');
      expect(body).toBeInstanceOf(FormData);
      expect(config).toMatchObject({
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  });
});
