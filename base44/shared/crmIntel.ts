// Contexto comercial reutilizable por las funciones de IA del CRM DAN&LOR.

export const STAGE_LABELS = {
  nuevo_lead: 'Nuevo lead',
  reunion_agendada: 'Reunión agendada',
  visita: 'Visita',
  presupuesto: 'Presupuesto',
  presupuesto_enviado: 'Presupuesto enviado',
  ganado: 'Ganado',
  en_ejecucion: 'En ejecución',
  ejecutado: 'Ejecutado',
  perdido: 'Perdido',
};

export const OPEN_STAGE_IDS = ['nuevo_lead', 'reunion_agendada', 'visita', 'presupuesto', 'presupuesto_enviado'];

export function euro(value) {
  if (!value && value !== 0) return '';
  return `${Number(value).toLocaleString('es-ES')} €`;
}

export function shortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES');
}

export function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

const normalize = (value) => (value || '').toString().toLowerCase().trim();

function zonesOverlap(first, second) {
  const a = normalize(first);
  const b = normalize(second);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  return a.split(/[,\s/]+/).some((token) => token.length > 3 && b.includes(token));
}

// Mismo criterio de encaje que usa la app en el cruce inmueble ↔ comprador.
export function matchScore(property, client) {
  const reasons = [];
  let score = 0;

  const interest = client.operation_interest || 'venta';
  const operation = property.operation || 'venta';
  if (interest !== 'ambas' && interest !== operation) return { score: 0, reasons };
  score += 20;
  reasons.push(`Busca ${operation}`);

  const types = client.property_types || [];
  if (types.length) {
    if (!types.includes(property.property_type)) return { score: 0, reasons };
    score += 25;
    reasons.push('Tipo de inmueble');
  }

  const price = Number(property.price) || 0;
  const max = Number(client.budget_max) || 0;
  const min = Number(client.budget_min) || 0;
  if (price && max) {
    if (price <= max && (!min || price >= min * 0.85)) {
      score += 30;
      reasons.push('Dentro de presupuesto');
    } else if (price <= max * 1.1) {
      score += 12;
      reasons.push('Hasta un 10 % por encima del presupuesto');
    } else {
      return { score: 0, reasons };
    }
  }

  if (zonesOverlap(client.search_zones || client.geographic_zone, property.zone)) {
    score += 25;
    reasons.push('Zona coincidente');
  }

  const minRooms = Number(client.min_rooms) || 0;
  if (minRooms) {
    if ((Number(property.rooms) || 0) < minRooms) return { score: 0, reasons };
    score += 15;
    reasons.push(`${minRooms}+ habitaciones`);
  }

  return { score: Math.min(100, score), reasons };
}

export async function loadClientIntel(base44, clientId) {
  const client = await base44.entities.Client.get(clientId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
  if (!client) return null;

  const [interactionRes, oppRes, taskRes, propertyRes] = await Promise.all([
    base44.entities.Interaction.filter({ client_id: clientId }, { sort: '-date', limit: 12 }),
    base44.entities.Opportunity.filter({ client_id: clientId }, { sort: '-updated_date', limit: 8 }),
    base44.entities.CommercialTask
      .filter({ client_id: clientId, status: 'pendiente' }, { sort: 'due_date', limit: 8 })
      .catch(() => ({ items: [] })),
    base44.entities.Property
      .filter({ status: 'disponible' }, { sort: '-created_date', limit: 60 })
      .catch(() => ({ items: [] })),
  ]);

  const matches = (propertyRes.items || [])
    .map((property) => ({ property, ...matchScore(property, client) }))
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    client,
    interactions: interactionRes.items || [],
    opportunities: oppRes.items || [],
    tasks: taskRes.items || [],
    matches,
  };
}

export function clientContextText(intel) {
  const { client, interactions, opportunities, tasks, matches } = intel;

  const profile = [
    client.operation_interest ? `Operación: ${client.operation_interest}` : '',
    client.budget_min ? `Desde ${euro(client.budget_min)}` : '',
    client.budget_max ? `Hasta ${euro(client.budget_max)}` : '',
    client.search_zones ? `Zonas: ${client.search_zones}` : '',
    client.property_types && client.property_types.length ? `Tipos: ${client.property_types.join(', ')}` : '',
    client.min_rooms ? `Habitaciones mínimas: ${client.min_rooms}` : '',
    client.geographic_zone ? `Zona del cliente: ${client.geographic_zone}` : '',
    client.daily_property_search ? 'Búsqueda diaria activa' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const history = interactions
    .map((item) => {
      const content = (item.content || '').replace(/\s+/g, ' ').slice(0, 260);
      const result = item.result ? ` (${item.result})` : '';
      return `- ${shortDate(item.date)} · ${item.type}${result}: ${content}`;
    })
    .join('\n');

  const pipeline = opportunities
    .map(
      (op) =>
        `- ${op.name} · ${STAGE_LABELS[op.stage] || op.stage} · ${euro(op.amount)} · estado ${op.status}${
          op.expected_closing_date ? ` · cierre previsto ${shortDate(op.expected_closing_date)}` : ''
        }`
    )
    .join('\n');

  const pending = tasks
    .map((task) => `- ${task.title} · límite ${shortDate(task.due_date) || 'sin fecha'} · ${task.category || 'general'}`)
    .join('\n');

  const inventory = matches
    .map(
      (item) =>
        `- ${item.property.title} · ${item.property.zone || 'zona sin definir'} · ${euro(item.property.price)} · ${item.property.rooms || '?'} hab. · ${
          item.property.surface || '?'
        } m² · encaje ${item.score}% (${item.reasons.join(', ')})`
    )
    .join('\n');

  const lastContact = interactions[0]?.date || null;

  return `FICHA DEL CLIENTE
Nombre: ${client.name}
Persona de contacto: ${client.contact_person || 'no indicada'}
Estado en el CRM: ${client.status || 'sin estado'}
Responsable: ${client.assigned_to || 'sin asignar'}
Perfil de búsqueda: ${profile || 'sin definir'}
Notas internas: ${(client.notes || '').slice(0, 500) || 'ninguna'}
Último contacto: ${lastContact ? `${shortDate(lastContact)} (hace ${daysSince(lastContact)} días)` : 'sin interacciones registradas'}

OPORTUNIDADES
${pipeline || 'sin oportunidades registradas'}

TAREAS PENDIENTES
${pending || 'sin tareas pendientes'}

INMUEBLES DE LA CARTERA QUE ENCAJAN
${inventory || 'ningún inmueble encaja con el perfil todavía'}

ÚLTIMAS INTERACCIONES
${history || 'sin interacciones registradas'}`;
}

export async function loadPipelineData(base44) {
  const [oppRes, taskRes, propertyRes, clientRes, interactionAgg] = await Promise.all([
    base44.entities.Opportunity.filter({ archived: false }, { sort: '-updated_date', limit: 200 }),
    base44.entities.CommercialTask.filter({ status: 'pendiente' }, { sort: 'due_date', limit: 200 }),
    base44.entities.Property.filter({}, { sort: 'mandate_end', limit: 200 }),
    base44.entities.Client.filter({}, { sort: 'name', limit: 200 }),
    base44.entities.Interaction.aggregate({ groupBy: 'client_id', max: ['date'] }).catch(() => ({ rows: [] })),
  ]);

  const lastContact = {};
  (interactionAgg.rows || []).forEach((row) => {
    lastContact[row.client_id] = row.max_date || row.date_max || null;
  });

  return {
    opportunities: oppRes.items || [],
    tasks: taskRes.items || [],
    properties: propertyRes.items || [],
    clients: clientRes.items || [],
    lastContact,
  };
}

export function pipelineContextText(data) {
  const { opportunities, tasks, properties, clients, lastContact } = data;
  const today = new Date().toISOString().slice(0, 10);

  const open = opportunities.filter((op) => op.status === 'open');
  const won = opportunities.filter((op) => op.status === 'won');
  const lost = opportunities.filter((op) => op.status === 'lost');
  const openValue = open.reduce((sum, op) => sum + (Number(op.amount) || 0), 0);

  const stageRows = OPEN_STAGE_IDS.map((stage) => {
    const list = open.filter((op) => op.stage === stage);
    const value = list.reduce((sum, op) => sum + (Number(op.amount) || 0), 0);
    return `${STAGE_LABELS[stage]}: ${list.length} oportunidades · ${euro(value)}`;
  }).join('\n');

  const stalled = open
    .map((op) => ({ op, days: daysSince(op.stage_changed_date || op.updated_date) }))
    .filter((item) => item.days !== null && item.days >= 7)
    .sort((a, b) => b.days - a.days)
    .slice(0, 12)
    .map((item) => `- ${item.op.name} · ${STAGE_LABELS[item.op.stage] || item.op.stage} · ${euro(item.op.amount)} · ${item.days} días sin moverse`)
    .join('\n');

  const closing = open
    .map((op) => ({ op, days: daysUntil(op.expected_closing_date) }))
    .filter((item) => item.days !== null && item.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 10)
    .map((item) => `- ${item.op.name} · ${euro(item.op.amount)} · cierre ${item.days < 0 ? `vencido hace ${Math.abs(item.days)} días` : `en ${item.days} días`}`)
    .join('\n');

  const overdue = tasks
    .filter((task) => task.due_date && task.due_date < today)
    .slice(0, 12)
    .map((task) => `- ${task.title} · venció el ${shortDate(task.due_date)} · ${task.assignee || 'sin responsable'}`)
    .join('\n');

  const mandates = properties
    .filter((property) => property.mandate_end)
    .map((property) => ({ property, days: daysUntil(property.mandate_end) }))
    .filter((item) => item.days !== null && item.days <= 21)
    .slice(0, 10)
    .map(
      (item) =>
        `- ${item.property.title} · ${item.property.owner_name || 'propietario sin nombre'} · mandato ${
          item.days < 0 ? `caducado hace ${Math.abs(item.days)} días` : `vence en ${item.days} días`
        }`
    )
    .join('\n');

  const coldLeads = clients
    .map((client) => ({ client, days: daysSince(lastContact[client.id]) }))
    .filter((item) => item.client.status !== 'descartado' && (item.days === null || item.days >= 21))
    .slice(0, 12)
    .map(
      (item) =>
        `- ${item.client.name} · ${item.client.status || 'sin estado'} · ${
          item.days === null ? 'sin interacciones' : `${item.days} días sin contacto`
        }`
    )
    .join('\n');

  return `RESUMEN DEL PIPELINE (hoy ${shortDate(today)})
Oportunidades abiertas: ${open.length} · valor ${euro(openValue)}
Ganadas: ${won.length} · Perdidas: ${lost.length}

EMBUDO POR ETAPA
${stageRows}

OPORTUNIDADES ESTANCADAS (7 días o más sin cambio de etapa)
${stalled || 'ninguna'}

CIERRES PREVISTOS EN LOS PRÓXIMOS 14 DÍAS
${closing || 'ninguno'}

TAREAS VENCIDAS
${overdue || 'ninguna'}

MANDATOS QUE VENCEN EN 21 DÍAS O CADUCADOS
${mandates || 'ninguno'}

CLIENTES FRÍOS (21 días o más sin contacto)
${coldLeads || 'ninguno'}`;
}