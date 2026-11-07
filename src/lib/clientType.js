export const CLIENT_TYPES = [
  { id: 'particular', label: 'Particulares', color: '#2f6fb0' },
  { id: 'empresa', label: 'Empresas', color: '#14b8a6' },
  { id: 'sin_ficha', label: 'Sin ficha', color: '#94a3b8' },
];

export const clientTypeOf = (client) => {
  if (!client) return 'sin_ficha';
  if (Number(client.employees_count) > 0 || client.web) return 'empresa';
  return 'particular';
};

export const clientTypeLabel = (id) => CLIENT_TYPES.find((type) => type.id === id)?.label || 'Sin ficha';