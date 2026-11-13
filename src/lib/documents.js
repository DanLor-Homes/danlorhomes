export const DOC_STATUSES = [
  { id: 'pendiente', label: 'Pendiente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'recibido', label: 'Recibido', className: 'bg-primary/10 text-primary' },
  { id: 'validado', label: 'Validado', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'no_aplica', label: 'No aplica', className: 'bg-muted text-muted-foreground' },
];

export const docStatusMeta = (id) => DOC_STATUSES.find((item) => item.id === id) || DOC_STATUSES[0];

const VENTA = [
  { doc_key: 'dni_propietario', label: 'DNI/NIE del propietario', required: true },
  { doc_key: 'nota_simple', label: 'Nota simple del Registro', required: true },
  { doc_key: 'escritura', label: 'Escritura de propiedad', required: true },
  { doc_key: 'certificado_energetico', label: 'Certificado energético', required: true },
  { doc_key: 'ibi', label: 'Último recibo del IBI', required: true },
  { doc_key: 'comunidad', label: 'Certificado de estar al corriente de la comunidad', required: true },
  { doc_key: 'mandato', label: 'Hoja de encargo firmada', required: true },
  { doc_key: 'arras', label: 'Contrato de arras', required: false },
  { doc_key: 'catastro', label: 'Ficha catastral', required: false },
];

const ALQUILER = [
  { doc_key: 'dni_propietario', label: 'DNI/NIE del propietario', required: true },
  { doc_key: 'nota_simple', label: 'Nota simple del Registro', required: true },
  { doc_key: 'certificado_energetico', label: 'Certificado energético', required: true },
  { doc_key: 'seguro', label: 'Póliza de seguro del inmueble', required: false },
  { doc_key: 'dni_inquilino', label: 'DNI/NIE del inquilino', required: true },
  { doc_key: 'solvencia', label: 'Nómina o justificante de solvencia', required: true },
  { doc_key: 'contrato_alquiler', label: 'Contrato de arrendamiento firmado', required: true },
  { doc_key: 'fianza', label: 'Justificante de depósito de fianza', required: true },
  { doc_key: 'inventario', label: 'Inventario y estado del inmueble', required: false },
];

export const templateFor = (operation) => (operation === 'alquiler' ? ALQUILER : VENTA);

export function checklistProgress(items = []) {
  const weighted = items.filter((item) => item.status !== 'no_aplica');
  const required = weighted.filter((item) => item.required !== false);
  const score = weighted.reduce(
    (total, item) => total + (item.status === 'validado' ? 1 : item.status === 'recibido' ? 0.5 : 0),
    0
  );
  const validated = items.filter((item) => item.status === 'validado').length;
  const pendingRequired = required.filter((item) => item.status === 'pendiente').length;
  const percent = weighted.length ? Math.round((score / weighted.length) * 100) : 0;

  return {
    total: items.length,
    validated,
    pendingRequired,
    percent,
    complete: weighted.length > 0 && weighted.every((item) => item.status === 'validado'),
  };
}