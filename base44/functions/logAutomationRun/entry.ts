import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const KEYS = ['pipeline', 'seguimiento', 'portales'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const args = body?.args && typeof body.args === 'object' ? body.args : body || {};
    const key = String(args.key || '').trim();
    if (!KEYS.includes(key)) return Response.json({ error: 'Automatización no válida' }, { status: 400 });

    const record = await base44.asServiceRole.entities.AutomationRun.create({
      key,
      run_at: new Date().toISOString(),
      summary: String(args.summary || '').slice(0, 240),
    });

    return Response.json({ ok: true, id: record.id, key });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}