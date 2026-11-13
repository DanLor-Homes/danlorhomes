import { base44 } from '@/api/base44Client';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const like = (fields, term) => ({
  $or: fields.map((field) => ({ [field]: { $regex: term, $options: 'i' } })),
});

const items = (page) => (Array.isArray(page) ? page : page?.items || []);

const join = (...parts) => parts.filter(Boolean).join(' · ');

const money = (value) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value)
    : null;

export async function searchCrm(rawTerm) {
  const query = rawTerm.trim();
  if (query.length < 2) return [];

  const term = escapeRegex(query);
  const options = { limit: 5, sort: '-created_date' };

  const [clients, properties, opportunities, tasks, leads] = await Promise.all([
    base44.entities.Client.filter(
      like(['name', 'email', 'phone', 'contact_person', 'geographic_zone'], term),
      options
    ),
    base44.entities.Property.filter(
      like(['title', 'reference', 'address', 'municipality', 'owner_name'], term),
      options
    ),
    base44.entities.Opportunity.filter(like(['name'], term), options),
    base44.entities.CommercialTask.filter(like(['title'], term), options),
    base44.entities.WebLead.filter(like(['name', 'email', 'phone', 'zone'], term), options),
  ]);

  return [
    ...items(clients).map((client) => ({
      id: client.id,
      kind: 'clientes',
      kindLabel: 'Cliente',
      title: client.name || 'Cliente sin nombre',
      subtitle: join(client.email || client.phone, client.geographic_zone),
      to: '/leads',
    })),
    ...items(properties).map((property) => ({
      id: property.id,
      kind: 'inmuebles',
      kindLabel: 'Inmueble',
      title: property.title || 'Inmueble sin título',
      subtitle: join(property.reference, property.municipality || property.zone, money(property.price)),
      to: `/inmuebles/${property.id}/ficha`,
    })),
    ...items(opportunities).map((opportunity) => ({
      id: opportunity.id,
      kind: 'oportunidades',
      kindLabel: 'Oportunidad',
      title: opportunity.name || 'Oportunidad sin nombre',
      subtitle: join(money(opportunity.amount), opportunity.expected_closing_date),
      to: '/pipeline',
    })),
    ...items(tasks).map((task) => ({
      id: task.id,
      kind: 'tareas',
      kindLabel: 'Tarea',
      title: task.title || 'Tarea sin título',
      subtitle: join(task.due_date, task.assignee),
      to: '/tareas',
    })),
    ...items(leads).map((lead) => ({
      id: lead.id,
      kind: 'leads',
      kindLabel: 'Lead web',
      title: lead.name || 'Lead sin nombre',
      subtitle: join(lead.phone || lead.email, lead.zone),
      to: '/leads',
    })),
  ];
}

export function groupResults(results) {
  const groups = new Map();
  results.forEach((result) => {
    if (!groups.has(result.kind)) {
      groups.set(result.kind, { kind: result.kind, label: result.kindLabel, items: [] });
    }
    groups.get(result.kind).items.push(result);
  });
  return Array.from(groups.values());
}