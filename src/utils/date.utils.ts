export function formatTaskDueLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const time = date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Hoy ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Mañana ${time}`;
  const day = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  return `${day} · ${time}`;
}

export function formatFutureDueLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

/** PRD §4.3: edad en años, o en meses si la mascota tiene menos de 1 año. `null` si no hay fecha de nacimiento válida. */
export function computeAgeLabel(birthDateIso?: string | null): string | null {
  if (!birthDateIso) return null;
  const birthDate = new Date(birthDateIso);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  if (birthDate.getTime() > now.getTime()) return null;

  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (now.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years >= 1) return `${years} año${years !== 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mes${months !== 1 ? 'es' : ''}`;
  return 'Menos de 1 mes';
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export function formatFullDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
