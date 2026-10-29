import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_EVENTS = 100;

function extractEmail(value) {
  if (!value) return '';
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim().toLowerCase();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const timeMin = new Date(Date.now() - 7 * 86400000).toISOString();
    const timeMax = new Date(Date.now() + days * 86400000).toISOString();
    const url =
      'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
      `?singleEvents=true&orderBy=startTime&maxResults=${MAX_EVENTS}` +
      `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

    const response = await fetch(url, { headers: authHeaders, signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      return Response.json({ error: 'Google Calendar no está disponible para esta cuenta' }, { status: 502 });
    }
    const data = await response.json();
    const events = data.items || [];
    if (!events.length) return Response.json({ synced: 0, skipped: 0 });

    const [clientRes, existingRes] = await Promise.all([
      base44.entities.Client.filter({}, { limit: 500 }),
      base44.entities.Interaction.filter({ source: 'google_calendar' }, { limit: 500 }),
    ]);

    const clientsByEmail = {};
    for (const client of clientRes.items || []) {
      if (client.email) clientsByEmail[String(client.email).toLowerCase()] = client.id;
    }
    const knownEmails = Object.keys(clientsByEmail);
    const seen = new Set((existingRes.items || []).map((interaction) => interaction.external_id));

    const toCreate = [];
    let skipped = 0;

    for (const event of events) {
      if (seen.has(event.id)) {
        skipped += 1;
        continue;
      }
      const emails = [
        event.organizer?.email,
        ...(event.attendees || []).map((attendee) => attendee.email),
      ]
        .filter(Boolean)
        .map(extractEmail);

      let clientId = '';
      for (const email of emails) {
        if (clientsByEmail[email]) {
          clientId = clientsByEmail[email];
          break;
        }
      }
      if (!clientId) {
        const summary = String(event.summary || '').toLowerCase();
        const matched = knownEmails.find((email) => summary.includes(email.split('@')[0]));
        if (matched) clientId = clientsByEmail[matched];
      }
      if (!clientId) {
        skipped += 1;
        continue;
      }

      const start = event.start?.dateTime || event.start?.date;
      if (!start) {
        skipped += 1;
        continue;
      }
      const date = event.start?.dateTime ? new Date(start).toISOString() : new Date(`${start}T09:00:00`).toISOString();
      const summary = event.summary || 'Evento de calendario';
      const type = /visita/i.test(summary) ? 'visita' : 'reunion';

      toCreate.push({
        client_id: clientId,
        type,
        date,
        content: `${summary}${event.location ? `\nLugar: ${event.location}` : ''}${
          event.description ? `\n\n${event.description}` : ''
        }`.slice(0, 2000),
        external_id: event.id,
        source: 'google_calendar',
      });
      seen.add(event.id);
    }

    if (toCreate.length) {
      await base44.entities.Interaction.bulkCreate(toCreate);
    }

    return Response.json({ synced: toCreate.length, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}