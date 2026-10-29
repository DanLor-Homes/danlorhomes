import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_MESSAGES = 25;

function extractEmail(value) {
  if (!value) return '';
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim().toLowerCase();
}

function headerValue(headers, name) {
  const found = (headers || []).find((header) => String(header.name).toLowerCase() === name);
  return found ? found.value : '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${MAX_MESSAGES}&q=${encodeURIComponent('newer_than:30d')}`,
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    if (!listResponse.ok) {
      return Response.json({ error: 'Gmail no está disponible para esta cuenta' }, { status: 502 });
    }
    const listData = await listResponse.json();
    const messageIds = (listData.messages || []).map((message) => message.id);
    if (!messageIds.length) return Response.json({ synced: 0, skipped: 0 });

    const [clientRes, existingRes] = await Promise.all([
      base44.entities.Client.filter({}, { limit: 500 }),
      base44.entities.Interaction.filter({ source: 'gmail' }, { limit: 500 }),
    ]);

    const clientsByEmail = {};
    for (const client of clientRes.items || []) {
      if (client.email) clientsByEmail[String(client.email).toLowerCase()] = client.id;
    }
    const knownEmails = Object.keys(clientsByEmail);

    const seen = new Set((existingRes.items || []).map((interaction) => interaction.external_id));

    let synced = 0;
    let skipped = 0;

    for (let index = 0; index < messageIds.length; index += 6) {
      const batch = messageIds.slice(index, index + 6);
      const results = await Promise.allSettled(
        batch.map((id) =>
          fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: authHeaders, signal: AbortSignal.timeout(10000) }
          ).then((response) => (response.ok ? response.json() : null))
        )
      );

      const toCreate = [];
      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        const message = result.value;
        if (seen.has(message.id)) {
          skipped += 1;
          continue;
        }
        const headers = message.payload?.headers || [];
        const from = headerValue(headers, 'from');
        const to = headerValue(headers, 'to');
        const subject = headerValue(headers, 'subject');

        let clientId = clientsByEmail[extractEmail(from)];
        if (!clientId) {
          const recipients = to.toLowerCase();
          const matched = knownEmails.find((email) => recipients.includes(email));
          if (matched) clientId = clientsByEmail[matched];
        }
        if (!clientId) {
          skipped += 1;
          continue;
        }

        const date = message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : new Date().toISOString();

        toCreate.push({
          client_id: clientId,
          type: 'email',
          date,
          content: `De: ${from}\nAsunto: ${subject || '(sin asunto)'}\n\n${message.snippet || ''}`.slice(0, 2000),
          external_id: message.id,
          source: 'gmail',
        });
        seen.add(message.id);
      }

      if (toCreate.length) {
        await base44.entities.Interaction.bulkCreate(toCreate);
        synced += toCreate.length;
      }
    }

    return Response.json({ synced, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}