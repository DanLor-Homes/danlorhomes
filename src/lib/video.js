export const VIDEO_SOURCE = 'videollamada';

export function createRoomCode() {
  const token = String(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 14);
  return `DANLOR-${token}`;
}

export function roomUrl(room) {
  return `https://meet.jit.si/${room}`;
}

export function embedUrl(room, displayName) {
  const params = ['config.prejoinPageEnabled=false', 'config.startWithAudioMuted=true'];
  if (displayName) params.push(`userInfo.displayName=${encodeURIComponent(`"${displayName}"`)}`);
  return `${roomUrl(room)}#${params.join('&')}`;
}

export function roomFromContent(content) {
  const match = String(content || '').match(/https:\/\/meet\.jit\.si\/([A-Za-z0-9-]+)/);
  return match ? match[1] : '';
}

export function whatsappLink(phone, clientName, room) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  const text = `Hola ${clientName || ''}, te paso el enlace de nuestra videollamada: ${roomUrl(room)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatCallDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}