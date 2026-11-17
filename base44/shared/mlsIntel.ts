// Contexto de la red MLS y de la cartera propia para las funciones de IA.
import { euro, matchScore } from './crmIntel.ts';

const clientProfile = (client) =>
  [
    client.operation_interest ? `busca ${client.operation_interest}` : '',
    client.budget_min ? `desde ${euro(client.budget_min)}` : '',
    client.budget_max ? `hasta ${euro(client.budget_max)}` : '',
    client.search_zones || client.geographic_zone ? `zonas ${client.search_zones || client.geographic_zone}` : '',
    client.property_types && client.property_types.length ? client.property_types.join(', ') : '',
    client.min_rooms ? `${client.min_rooms}+ hab.` : '',
  ]
    .filter(Boolean)
    .join(' · ') || 'perfil sin definir';

const propertyLine = (item) =>
  `${item.title} · ${euro(item.price)} · ${item.zone || 'zona sin definir'} · ${item.surface || '?'} m² · ${
    item.rooms || '?'
  } hab.`;

export async function loadMlsIntel(base44, userId) {
  const [listingRes, clientRes, propertyRes, interestRes, partnerRes] = await Promise.all([
    base44.entities.MlsListing.filter({ status: 'disponible' }, { sort: '-published_date', limit: 200 }),
    base44.entities.Client.filter({}, { sort: 'name', limit: 200 }),
    base44.entities.Property
      .filter({ status: 'disponible' }, { sort: '-created_date', limit: 200 })
      .catch(() => ({ items: [] })),
    base44.entities.MlsInterest
      .filter({ status: 'nuevo' }, { sort: '-created_date', limit: 40 })
      .catch(() => ({ items: [] })),
    base44.entities.MlsPartner
      .filter({ active: true }, { sort: 'name', limit: 100 })
      .catch(() => ({ items: [] })),
  ]);

  const listings = listingRes.items || [];
  const mine = listings.filter((listing) => listing.property_id || (userId && listing.created_by_id === userId));
  const mineIds = new Set(mine.map((listing) => listing.id));
  const network = listings.filter((listing) => !mineIds.has(listing.id));
  const clients = (clientRes.items || []).filter((client) => client.status !== 'descartado');
  const portfolio = propertyRes.items || [];

  const pairs = [];
  network.forEach((listing) => {
    clients.forEach((client) => {
      const match = matchScore(listing, client);
      if (match.score >= 40) pairs.push({ listing, client, score: match.score, reasons: match.reasons });
    });
  });
  pairs.sort((a, b) => b.score - a.score);

  const matches = pairs.slice(0, 12);

  const networkTop = {};
  pairs.forEach((pair) => {
    if (!networkTop[pair.client.id]) networkTop[pair.client.id] = pair.score;
  });

  const gaps = clients
    .filter((client) => {
      if (networkTop[client.id]) return false;
      const covered = portfolio.some((property) => matchScore(property, client).score >= 40);
      return !covered && Boolean(client.budget_max || (client.property_types || []).length);
    })
    .slice(0, 10);

  return {
    mine,
    network,
    clients,
    portfolio,
    matches,
    gaps,
    interests: interestRes.items || [],
    partners: partnerRes.items || [],
  };
}

export function mlsContextText(intel) {
  const { mine, network, clients, portfolio, matches, gaps, interests, partners } = intel;

  const mineText = mine
    .slice(0, 20)
    .map(
      (listing) =>
        `- ${propertyLine(listing)} · ${listing.operation || 'venta'} · honorarios compartidos ${
          listing.commission_percent ? `${listing.commission_percent} %` : 'sin definir'
        } · ${listing.agency || 'mi agencia'}`
    )
    .join('\n');

  const networkText = network
    .slice(0, 30)
    .map(
      (listing) =>
        `- ${propertyLine(listing)} · ${listing.operation || 'venta'} · agencia ${listing.agency || 'sin nombre'} · ${
          listing.commission_percent ? `${listing.commission_percent} % honorarios` : 'honorarios sin definir'
        }${listing.agent_name ? ` · contacto ${listing.agent_name}` : ''}`
    )
    .join('\n');

  const clientsText = clients
    .slice(0, 30)
    .map((client) => `- ${client.name} · ${clientProfile(client)} · estado ${client.status || 'sin estado'}`)
    .join('\n');

  const pairsText = matches
    .map(
      ({ listing, client, score, reasons }) =>
        `- Inmueble «${listing.title}» (${listing.agency || 'agencia sin nombre'}) ↔ demandante ${client.name} · encaje ${score} % (${reasons.join(', ')})`
    )
    .join('\n');

  const gapsText = gaps.map((client) => `- ${client.name} · ${clientProfile(client)}`).join('\n');

  const partnersText = partners
    .slice(0, 15)
    .map(
      (partner) =>
        `- ${partner.name} · ${partner.zone || 'zona sin definir'}${partner.contact_person ? ` · ${partner.contact_person}` : ''}${
          partner.commission_notes ? ` · acuerdo: ${(partner.commission_notes || '').slice(0, 100)}` : ''
        }`
    )
    .join('\n');

  const interestsText = interests
    .slice(0, 15)
    .map(
      (interest) =>
        `- ${interest.listing_title || 'inmueble'} · ${interest.agency || 'agencia'} · ${
          interest.message ? (interest.message || '').replace(/\s+/g, ' ').slice(0, 140) : 'sin mensaje'
        }`
    )
    .join('\n');

  return `BOLSA INMOBILIARIA DE LA RED
Publicaciones propias disponibles: ${mine.length} · de otras agencias: ${network.length}
Demandantes activos: ${clients.length} · inmuebles propios en cartera disponible: ${portfolio.length}
Solicitudes de colaboración sin atender: ${interests.length}

MIS INMUEBLES EN LA BOLSA
${mineText || 'ninguno publicado'}

INMUEBLES DE OTRAS AGENCIAS
${networkText || 'ninguno disponible en la red'}

DEMANDANTES ACTIVOS
${clientsText || 'ninguno'}

CRUCES QUE ENCAJAN SEGÚN EL CRM
${pairsText || 'ningún cruce por encima del 40 % de encaje'}

DEMANDANTES SIN OFERTA NI EN LA RED NI EN CARTERA
${gapsText || 'ninguno'}

AGENCIAS COLABORADORAS
${partnersText || 'ninguna registrada'}

SOLICITUDES DE COLABORACIÓN SIN ATENDER
${interestsText || 'ninguna'}`;
}