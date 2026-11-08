export function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export function captureHint(listing) {
  const days = daysSince(listing.first_seen) || 0;
  if (listing.status === 'contactado') {
    return {
      text: days >= 7 ? `Contactado hace ${days} días: toca segundo contacto` : `Seguimiento abierto (${days} días desde que lo detectaste)`,
      urgent: days >= 7,
    };
  }
  if (listing.status === 'nuevo') {
    return {
      text: days >= 2 ? `Lleva ${days} días sin contactar: llámalo hoy` : 'Recién detectado: contáctalo hoy',
      urgent: days >= 2,
    };
  }
  return { text: `Revisado hace ${days} días`, urgent: false };
}

export function portfolioHint(property, { visits = 0, lastVisitDays = null, daysOnMarket = null } = {}) {
  const mandateDays = daysUntil(property.mandate_end);
  if (mandateDays !== null && mandateDays <= 30) {
    return {
      tone: 'amber',
      text:
        mandateDays < 0
          ? `Mandato vencido hace ${Math.abs(mandateDays)} días: renuévalo`
          : `El mandato vence en ${mandateDays} días`,
    };
  }
  if (!visits && daysOnMarket !== null && daysOnMarket >= 21) {
    return { tone: 'rose', text: `Sin visitas en ${daysOnMarket} días: revisa precio y fotos` };
  }
  if (lastVisitDays !== null && lastVisitDays >= 21) {
    return { tone: 'amber', text: `Última visita hace ${lastVisitDays} días: retoma el contacto` };
  }
  if (!visits) return { tone: 'muted', text: 'Sin visitas registradas' };
  return { tone: 'ok', text: `${visits} visita${visits === 1 ? '' : 's'} registrada${visits === 1 ? '' : 's'}` };
}