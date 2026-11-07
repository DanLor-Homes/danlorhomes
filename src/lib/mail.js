const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

const FIELDS = {
  nombre: (client) => client?.name || '',
  email: (client) => client?.email || '',
  telefono: (client) => client?.phone || '',
  persona: (client) => client?.contact_person || client?.name || '',
  zona: (client) => client?.geographic_zone || client?.search_zones || '',
  agente: () => 'DAN&LOR HOMES',
};

export function applyTemplate(text, client) {
  return String(text || '').replace(PLACEHOLDER, (_, key) => FIELDS[String(key).toLowerCase()]?.(client) ?? '');
}

export function parseEmail(content) {
  const lines = String(content || '').split('\n');
  const meta = {};
  let index = 0;

  while (index < lines.length) {
    const match = lines[index].match(/^(Para|De|Asunto):\s*(.*)$/i);
    if (!match) break;
    meta[match[1].toLowerCase()] = match[2];
    index += 1;
  }

  if (!Object.keys(meta).length) {
    return { to: '', from: '', subject: '', body: String(content || '').trim() };
  }

  return {
    to: meta.para || '',
    from: meta.de || '',
    subject: meta.asunto || '(sin asunto)',
    body: lines.slice(index).join('\n').trim(),
  };
}

export const TEMPLATE_CATEGORIES = {
  seguimiento: 'Seguimiento',
  visita: 'Visita',
  oferta: 'Oferta',
  cierre: 'Cierre',
  documentacion: 'Documentación',
  otro: 'Otro',
};