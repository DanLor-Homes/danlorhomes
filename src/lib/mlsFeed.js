export function newFeedToken() {
  const raw =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}${Math.random()}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
}

export function buildFeedUrl(token) {
  if (!token || typeof window === 'undefined') return '';
  return `${window.location.origin}/functions/mlsFeed?token=${encodeURIComponent(token)}`;
}

export function formatSyncDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}