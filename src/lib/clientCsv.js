import { statusMeta } from '@/lib/clientStatus';

const COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'status', label: 'Estado', format: (value) => statusMeta(value).label },
  { key: 'contact_person', label: 'Persona de contacto' },
  { key: 'second_contact', label: 'Segundo contacto' },
  { key: 'web', label: 'Web' },
  { key: 'geographic_zone', label: 'Zona geográfica' },
  { key: 'assigned_to', label: 'Responsable' },
  { key: 'operation_interest', label: 'Busca' },
  { key: 'property_types', label: 'Tipos de inmueble', format: (value) => (Array.isArray(value) ? value.join(' | ') : value) },
  { key: 'search_zones', label: 'Zonas de interés' },
  { key: 'budget_min', label: 'Presupuesto mínimo' },
  { key: 'budget_max', label: 'Presupuesto máximo' },
  { key: 'min_rooms', label: 'Habitaciones mínimas' },
  { key: 'employees_count', label: 'Empleados' },
  { key: 'daily_property_search', label: 'Búsqueda diaria', format: (value) => (value ? 'Sí' : 'No') },
  { key: 'notes', label: 'Notas' },
];

const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/"/g, '""');
};

export function buildClientsCsv(clients) {
  const header = COLUMNS.map((column) => `"${column.label}"`).join(',');
  const rows = clients.map((client) =>
    COLUMNS.map((column) => {
      const raw = column.format ? column.format(client[column.key], client) : client[column.key];
      return `"${escapeCell(raw)}"`;
    }).join(',')
  );
  return [header, ...rows].join('\r\n');
}

export function exportClientsCsv(clients, filename = 'clientes') {
  const csv = buildClientsCsv(clients);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}