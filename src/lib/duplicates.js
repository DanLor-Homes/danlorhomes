const cleanText = (value) =>
  (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const emailKey = (value) => (value || '').trim().toLowerCase();

const phoneKey = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : '';
};

export const CLIENT_DUPLICATE_SPECS = [
  { label: 'Mismo email', of: (record) => record.email, normalize: emailKey, min: 5 },
  { label: 'Mismo teléfono', of: (record) => record.phone, normalize: phoneKey, min: 9 },
  { label: 'Mismo nombre', of: (record) => record.name, normalize: cleanText, min: 4 },
];

export const LEAD_DUPLICATE_SPECS = [
  { label: 'Mismo email', of: (record) => record.email, normalize: emailKey, min: 5 },
  { label: 'Mismo teléfono', of: (record) => record.phone, normalize: phoneKey, min: 9 },
  { label: 'Mismo nombre', of: (record) => record.name, normalize: cleanText, min: 4 },
];

/**
 * Agrupa fichas que comparten email, teléfono o nombre.
 * Solo detecta coincidencias: no modifica ni fusiona nada.
 */
export function findDuplicates(records, specs = CLIENT_DUPLICATE_SPECS) {
  if (!records.length) return [];

  const parent = new Map(records.map((record) => [record.id, record.id]));

  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    parent.set(id, root);
    return root;
  };

  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  const hits = [];
  specs.forEach((spec) => {
    const buckets = new Map();
    records.forEach((record) => {
      const raw = spec.of(record);
      const key = spec.normalize ? spec.normalize(raw) : cleanText(raw);
      if (!key || key.length < (spec.min || 2)) return;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(record);
    });
    buckets.forEach((bucket) => {
      if (bucket.length < 2) return;
      hits.push({ label: spec.label, records: bucket });
    });
  });

  hits.forEach((hit) => {
    const [first, ...rest] = hit.records;
    rest.forEach((record) => union(first.id, record.id));
  });

  const groups = new Map();
  hits.forEach((hit) => {
    hit.records.forEach((record) => {
      const root = find(record.id);
      if (!groups.has(root)) groups.set(root, { id: root, records: [], reasons: new Set() });
      const group = groups.get(root);
      if (!group.records.some((item) => item.id === record.id)) group.records.push(record);
      group.reasons.add(hit.label);
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      id: group.id,
      records: group.records,
      reasons: Array.from(group.reasons),
    }))
    .sort((a, b) => b.records.length - a.records.length);
}