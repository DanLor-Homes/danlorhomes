import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, ClipboardCheck, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/crm/PageHeader';
import StatCard from '@/components/crm/StatCard';
import EmptyState from '@/components/crm/EmptyState';
import DocPropertyRow from '@/components/docs/DocPropertyRow';
import DocChecklistDialog from '@/components/docs/DocChecklistDialog';
import { checklistProgress } from '@/lib/documents';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendientes', label: 'Con pendientes' },
  { id: 'completos', label: 'Completos' },
];

export default function Documents() {
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const [propertyPage, docPage] = await Promise.all([
      base44.entities.Property.list({ sort: 'title', limit: 500 }),
      base44.entities.PropertyDocument.list({ sort: '-created_date', limit: 1000 }),
    ]);
    setProperties(propertyPage.items || []);
    setDocuments(docPage.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const entries = useMemo(() => {
    const grouped = documents.reduce((acc, document) => {
      acc[document.property_id] = [...(acc[document.property_id] || []), document];
      return acc;
    }, {});

    return properties.map((property) => ({
      property,
      items: grouped[property.id] || [],
      progress: checklistProgress(grouped[property.id] || []),
    }));
  }, [properties, documents]);

  const visible = entries.filter((entry) => {
    const term = search.trim().toLowerCase();
    const matchesTerm =
      !term || `${entry.property.title} ${entry.property.zone || ''}`.toLowerCase().includes(term);
    const matchesFilter =
      filter === 'todos' || (filter === 'completos' ? entry.progress.complete : !entry.progress.complete);
    return matchesTerm && matchesFilter;
  });

  const complete = entries.filter((entry) => entry.progress.complete).length;
  const pendingRequired = entries.reduce((total, entry) => total + entry.progress.pendingRequired, 0);

  return (
    <div className="app-canvas mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Expedientes"
        title="Checklist documental"
        description="Controla qué documentación falta en cada inmueble antes de firmar y adjunta los archivos al expediente."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Inmuebles" value={entries.length} hint="Con expediente documental" icon={ClipboardCheck} tone="primary" />
        <StatCard label="Completos" value={complete} hint="Toda la documentación validada" icon={BadgeCheck} tone="emerald" />
        <StatCard label="Pendientes" value={pendingRequired} hint="Documentos obligatorios sin recibir" icon={AlertTriangle} tone="rose" />
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar inmueble o zona"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                filter === item.id
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No hay inmuebles en esta vista"
          description="Añade inmuebles a la cartera para generar su expediente documental."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => (
            <DocPropertyRow
              key={entry.property.id}
              property={entry.property}
              items={entry.items}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      <DocChecklistDialog
        open={Boolean(selected)}
        property={selected}
        documents={documents}
        onOpenChange={(value) => !value && setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}