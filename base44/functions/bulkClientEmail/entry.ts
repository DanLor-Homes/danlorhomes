import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_RECIPIENTS = 25;
const BATCH_SIZE = 5;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const clientIds = Array.isArray(payload.client_ids)
      ? payload.client_ids.filter((id) => typeof id === 'string' && id).slice(0, MAX_RECIPIENTS)
      : [];
    const subject = typeof payload.subject === 'string' ? payload.subject.trim().slice(0, 200) : '';
    const body = typeof payload.body === 'string' ? payload.body.trim().slice(0, 10000) : '';

    if (clientIds.length === 0) return Response.json({ error: 'Selecciona al menos un cliente.' }, { status: 400 });
    if (!subject || !body) return Response.json({ error: 'Asunto y mensaje son obligatorios.' }, { status: 400 });

    const { items } = await base44.entities.Client.filter({ id: { $in: clientIds } }, { limit: MAX_RECIPIENTS });
    const recipients = items.filter((client) => typeof client.email === 'string' && client.email.includes('@'));

    let sent = 0;
    const errors = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(
        chunk.map((client) =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: client.email.trim(),
            subject,
            body: body.replace(/\n/g, '<br/>'),
            from_name: 'DAN&LOR',
          })
        )
      );
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          errors.push({ client: chunk[index].name, error: result.reason?.message || 'Error de envío' });
        }
      });
    }

    return Response.json({
      sent,
      total: recipients.length,
      skipped: items.length - recipients.length,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}