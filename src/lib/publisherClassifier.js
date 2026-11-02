const norm = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const PRIVATE_TERMS = [
  'particular',
  'sin comisiones',
  'sin comision',
  'sin intermediarios',
  'propietario directo',
  'directo propietario',
  'vende propietario',
  'alquila propietario',
  'trato directo',
  'abstenerse agencias',
  'abstenerse inmobiliarias',
  'no agencias',
  'dueno',
  'duena',
  'sin agencia',
];

const AGENCY_TERMS = [
  'inmobiliaria',
  'agencia',
  'real estate',
  'fincas',
  'asesores',
  'servicios inmobiliarios',
  'gestion inmobiliaria',
  'consultora',
];

const AGENCY_BRANDS = [
  'remax',
  're/max',
  'century 21',
  'keller williams',
  'engel &',
  'tecnocasa',
  'don piso',
  'look & find',
  'look&find',
  'apialia',
  'solvia',
  'servihabitat',
  'aliseda',
  'casaktua',
  'hipoges',
  'uniqoo',
  'gilmar',
  'promora',
];

const LEGAL_FORM = /\b(s\. ?l\.?(u)?|s\. ?a\.?|c\. ?b\.?|sociedad limitada|sociedad anonima)\b/;
const PERSON_NAME = /^[a-z]+( [a-z]+){1,2}$/;

/**
 * Clasifica el anunciante de un inmueble a partir de su nombre de contacto,
 * título, descripción y notas. Solo decide cuando hay señales claras.
 */
export function classifyPublisher(listing) {
  const text = norm([listing?.contact_name, listing?.title, listing?.description, listing?.notes].filter(Boolean).join(' · '));
  const contact = norm(listing?.contact_name);
  const evidence = [];
  let score = 0;

  PRIVATE_TERMS.forEach((term) => {
    if (text.includes(term)) {
      score += 3;
      evidence.push(term);
    }
  });

  AGENCY_BRANDS.forEach((term) => {
    if (text.includes(term)) {
      score -= 5;
      evidence.push(term);
    }
  });

  AGENCY_TERMS.forEach((term) => {
    if (text.includes(term)) {
      score -= 2;
      evidence.push(term);
    }
  });

  if (LEGAL_FORM.test(text)) {
    score -= 4;
    evidence.push('sociedad');
  }

  if (contact && PERSON_NAME.test(contact) && !AGENCY_TERMS.some((term) => contact.includes(term))) {
    score += 2;
    evidence.push('nombre personal');
  }

  const publisher_type = score >= 3 ? 'particular' : score <= -3 ? 'inmobiliaria' : 'desconocido';

  return {
    publisher_type,
    score,
    evidence: [...new Set(evidence)].slice(0, 3),
  };
}

export function classificationHint(listing) {
  const { evidence } = classifyPublisher(listing);
  if (evidence.length) return `Particular detectado por: ${evidence.join(', ')}`;
  return 'Clasificado como particular';
}