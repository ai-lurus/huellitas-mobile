export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Hace un momento';
  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
