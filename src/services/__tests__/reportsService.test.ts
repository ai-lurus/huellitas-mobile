import { httpClient } from '../../network';
import { reportsService } from '../reportsService';

jest.mock('../../network', () => ({
  httpClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('reportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateLostReport', () => {
    it('PATCH /api/v1/lost-reports/:id con la ubicación, fecha y mensaje actualizados', async () => {
      jest.mocked(httpClient.patch).mockResolvedValueOnce({ data: {} });

      await reportsService.updateLostReport('report_1', {
        lat: 19.4,
        lng: -99.1,
        lastSeenAt: '2026-06-01T10:00:00.000Z',
        message: 'Nuevo mensaje',
      });

      expect(httpClient.patch).toHaveBeenCalledWith('/api/v1/lost-reports/report_1', {
        lat: 19.4,
        lng: -99.1,
        lastSeenAt: '2026-06-01T10:00:00.000Z',
        message: 'Nuevo mensaje',
      });
    });

    it('omite "message" cuando viene vacío', async () => {
      jest.mocked(httpClient.patch).mockResolvedValueOnce({ data: {} });

      await reportsService.updateLostReport('report_1', {
        lat: 19.4,
        lng: -99.1,
        lastSeenAt: '2026-06-01T10:00:00.000Z',
        message: '   ',
      });

      expect(httpClient.patch).toHaveBeenCalledWith('/api/v1/lost-reports/report_1', {
        lat: 19.4,
        lng: -99.1,
        lastSeenAt: '2026-06-01T10:00:00.000Z',
      });
    });
  });

  describe('getLostReportDetail', () => {
    it('incluye "lastSeenAt" cuando el backend lo expone', async () => {
      jest
        .mocked(httpClient.get)
        .mockResolvedValueOnce({
          data: {
            id: 'report_1',
            petName: 'Max',
            petSpecies: 'dog',
            lat: 19.4,
            lng: -99.1,
            lastSeenAt: '2026-06-01T10:00:00.000Z',
            sightings: [],
          },
        })
        .mockResolvedValueOnce({ data: [] });

      const detail = await reportsService.getLostReportDetail('report_1');
      expect(detail.lastSeenAt).toBe('2026-06-01T10:00:00.000Z');
    });
  });

  describe('getMyReports (§7.6 Mis reportes)', () => {
    it('GET /api/v1/lost-reports/mine y agrupa por estado resuelto/activo', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({
        data: [
          { id: 'r1', petName: 'Max', petSpecies: 'dog', createdAt: '2026-06-01T10:00:00.000Z' },
          {
            id: 'r2',
            petName: 'Luna',
            petSpecies: 'cat',
            createdAt: '2026-05-01T10:00:00.000Z',
            resolvedAt: '2026-05-10T10:00:00.000Z',
          },
        ],
      });

      const reports = await reportsService.getMyReports();

      expect(httpClient.get).toHaveBeenCalledWith('/api/v1/lost-reports/mine');
      expect(reports).toHaveLength(2);
      expect(reports[0]?.reportKind).toBe('lost');
      expect(reports[1]?.reportKind).toBe('resolved');
    });

    it('descarta entradas sin id o nombre de mascota', async () => {
      jest.mocked(httpClient.get).mockResolvedValueOnce({
        data: [{ petSpecies: 'dog', createdAt: '2026-06-01T10:00:00.000Z' }],
      });

      const reports = await reportsService.getMyReports();
      expect(reports).toHaveLength(0);
    });
  });
});
