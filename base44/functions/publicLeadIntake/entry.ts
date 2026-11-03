import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OPERATIONS = ['venta', 'alquiler', 'ambas'];
const PROPERTY_TYPES = ['piso', 'atico', 'adosado', 'chalet', 'local', 'oficina', 'garaje', 'nave', 'terreno'];

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalize(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ruleForZone(zone, rules) {
  const target = normalize(zone);
  if (!target) return null;
  const candidates = (rules || [])
    .filter((rule) => rule.active !== false && rule.zone && rule.assignee)
    .sort(
      (a, b) =>
        normalize(b.zone).length - normalize(a.zone).length ||
        (Number(b.priority) || 0) - (Number(a.priority) || 0)
    );
  return (
    candidates.find((rule) => {
      const key = normalize(rule.zone);
      return target.includes(key) || key.includes(target);
    }) || null
  );
}

export default async function (req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Honeypot: bots rellenan este campo oculto; respondemos ok sin guardar nada.
    if (clean(body.website, 200)) {
      return Response.json({ ok: true });
    }

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160);
    const zone = clean(body.zone, 160);
    const notes = clean(body.notes, 1500);

    if (!name) return Response.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    if (!phone && !email) {
      return Response.json({ error: 'Añade un teléfono o un email de contacto' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Response.json({ error: 'El email no parece válido' }, { status: 400 });
    }
    if (body.consent !== true) {
      return Response.json({ error: 'Necesitamos tu consentimiento para contactarte' }, { status: 400 });
    }

    const operation = OPERATIONS.includes(body.operation) ? body.operation : 'venta';
    const budget = Number(body.budget);
    const budgetMax = Number.isFinite(budget) && budget > 0 ? Math.min(budget, 100000000) : undefined;
    const types = Array.isArray(body.property_types)
      ? body.property_types.filter((type) => PROPERTY_TYPES.includes(type)).slice(0, 9)
      : [];

    const rules = await base44.asServiceRole.entities.AssignmentRule.filter({ active: true });
    const rule = ruleForZone(zone, rules);
    const origin = new URL(req.url).origin;

    const client = await base44.asServiceRole.entities.Client.create({
      name,
      phone,
      email,
      operation_interest: operation,
      search_zones: zone,
      budget_max: budgetMax,
      property_types: types,
      notes: notes ? `${notes}\n\nAlta desde el formulario web (${origin})` : `Alta desde el formulario web (${origin})`,
      assigned_to: rule?.assignee || '',
    });

    await base44.asServiceRole.entities.CommercialTask.create({
      title: `Primer contacto con ${client.name}`,
      due_date: new Date().toISOString().slice(0, 10),
      assignee: rule?.assignee || '',
      auto_generated: true,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}