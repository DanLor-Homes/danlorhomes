function normalize(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Regla que gana para una zona: la coincidencia más específica primero. */
export function ruleForZone(zone, rules = []) {
  const target = normalize(zone);
  if (!target) return null;

  const candidates = rules
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