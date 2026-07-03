export type RadarDateRangeFilter = 'all' | '24h' | 'week' | 'month';

const RANGE_MS: Record<Exclude<RadarDateRangeFilter, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export const RADAR_DATE_RANGE_OPTIONS: Array<{ key: RadarDateRangeFilter; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: '24h', label: 'Últimas 24h' },
  { key: 'week', label: 'Última semana' },
  { key: 'month', label: 'Último mes' },
];

export function isWithinDateRange(iso: string, filter: RadarDateRangeFilter): boolean {
  if (filter === 'all') return true;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return true;
  return Date.now() - created <= RANGE_MS[filter];
}
