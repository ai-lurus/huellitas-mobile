import { httpClient } from '../../network';
import { servicesService } from '../servicesService';

jest.mock('../../network', () => ({
  httpClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('servicesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCatalog: GET /api/v1/service-categories y descarta entradas inválidas', async () => {
    jest.mocked(httpClient.get).mockResolvedValueOnce({
      data: [
        { id: 'cat_1', key: 'grooming', name: 'Grooming', description: 'Baño y corte' },
        { id: 'bad', key: 'not-a-key', name: 'x', description: 'y' },
      ],
    });

    const result = await servicesService.getCatalog();

    expect(httpClient.get).toHaveBeenCalledWith('/api/v1/service-categories');
    expect(result).toEqual([
      { id: 'cat_1', key: 'grooming', name: 'Grooming', description: 'Baño y corte' },
    ]);
  });

  it('getServiceDetail: incluye providerId como query param cuando se especifica', async () => {
    jest.mocked(httpClient.get).mockResolvedValueOnce({
      data: {
        id: 'svc_1',
        categoryId: 'cat_1',
        categoryKey: 'grooming',
        name: 'Baño y corte',
        providerId: 'prov_1',
      },
    });

    const detail = await servicesService.getServiceDetail('cat_1', 'prov_1');

    expect(httpClient.get).toHaveBeenCalledWith(
      '/api/v1/service-categories/cat_1/detail?providerId=prov_1',
    );
    expect(detail.providerId).toBe('prov_1');
  });

  it('createBooking: POST /api/v1/bookings con el payload de la reserva', async () => {
    jest.mocked(httpClient.post).mockResolvedValueOnce({
      data: {
        id: 'booking_1',
        serviceId: 'svc_1',
        serviceName: 'Baño y corte',
        categoryKey: 'grooming',
        status: 'pending',
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    });

    await servicesService.createBooking({
      serviceId: 'svc_1',
      petId: 'pet_1',
      scheduledAt: '2026-07-05T15:00:00.000Z',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/api/v1/bookings', {
      serviceId: 'svc_1',
      petId: 'pet_1',
      scheduledAt: '2026-07-05T15:00:00.000Z',
    });
  });

  it('cancelBooking: PATCH /api/v1/bookings/:id con status cancelled', async () => {
    jest.mocked(httpClient.patch).mockResolvedValueOnce({
      data: {
        id: 'booking_1',
        serviceId: 'svc_1',
        serviceName: 'Baño y corte',
        categoryKey: 'grooming',
        status: 'cancelled',
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    });

    const result = await servicesService.cancelBooking('booking_1');

    expect(httpClient.patch).toHaveBeenCalledWith('/api/v1/bookings/booking_1', {
      status: 'cancelled',
    });
    expect(result.status).toBe('cancelled');
  });
});
