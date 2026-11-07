import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const subject = typeof payload.subject === 'string' ? payload.subject.trim().slice(0, 200) : '';
    const body = typeof payload.body === 'string' ? payload.body.trim().slice(0, 8000) : '';
    const clientId = typeof payload.client_id === 'string' ? payload.client_id : '';
    const manualTo = typeof payload.to === 'string' ? payload.to.trim().toLowerCase() : '';

    if (!subject || !body) {
      return Response.json({ error: 'Escribe un asunto y un mensaje.' }, { status: 400 });
    }

    let client = null;
    if (clientId) {
      client = await base44.entities.Client.get(clientId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!client) return Response.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }

    const to = (client?.email || manualTo).toLowerCase();
    if (!EMAIL_RE.test(to)) {
      return Response.json({ error: 'No hay un email de destino válido.' }, { status: 400 });
    }

    const html = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>');

    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#111827">${html}</div>`,
      from_name: 'DAN&LOR HOMES',
      category: 'transactional',
    });

    if (result && result.success === false) {
      return Response.json(
        { error: result.message || 'El correo no se pudo entregar a esta dirección.' },
        { status: 400 }
      );
    }

    if (client) {
      await base44.entities.Interaction.create({
        client_id: client.id,
        type: 'email',
        date: new Date().toISOString(),
        content: `Para: ${to}\nAsunto: ${subject}\n\n${body}`.slice(0, 4000),
        source: 'app',
      });
    }

    return Response.json({ sent: true, to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}