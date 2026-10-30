import React from 'react';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDateTime } from '@/lib/crm';
import { portalLabel, propertyTypeLabel } from '@/lib/portals';

export default function SourceCard({ source, scanning, onScan, onEdit, onDelete, onToggle }) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold">{source.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {portalLabel(source.portal)} · {source.zone} ·{' '}
            {source.operation === 'alquiler' ? 'Alquiler' : 'Venta'} · {propertyTypeLabel(source.property_type)}
          </p>
        </div>
        <Switch checked={Boolean(source.active)} onCheckedChange={(value) => onToggle(source, value)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span>{source.last_run ? `Revisada ${formatDateTime(source.last_run)}` : 'Sin revisar todavía'}</span>
        {typeof source.last_result_count === 'number' && (
          <span className="rounded-md bg-muted px-1.5 py-0.5">{source.last_result_count} nuevos</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onScan(source)} disabled={scanning}>
          <RefreshCw className={scanning ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /> Revisar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(source)} aria-label="Editar búsqueda">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(source)} aria-label="Eliminar búsqueda">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}