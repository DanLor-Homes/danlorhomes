import React from 'react';
import { BadgeCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checklistProgress } from '@/lib/documents';
import { cn } from '@/lib/utils';

export default function DocPropertyRow({ property, items = [], onOpen }) {
  const progress = checklistProgress(items);
  const pending = items.filter((item) => item.status === 'pendiente' && item.required !== false);
  const started = items.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold">{property.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {property.operation === 'alquiler' ? 'Alquiler' : 'Venta'} · {property.zone || 'Sin zona'}
          </p>
        </div>
        {progress.complete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="h-3.5 w-3.5" /> Completo
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {started ? `${progress.pendingRequired} pendientes` : 'Sin expediente'}
          </span>
        )}
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {progress.validated} de {progress.total || '—'} documentos validados
        </p>
      </div>

      {pending.length > 0 && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {pending.slice(0, 2).map((item) => (
            <li key={item.id} className="truncate">
              · {item.label}
            </li>
          ))}
          {pending.length > 2 && <li className="truncate">· y {pending.length - 2} más</li>}
        </ul>
      )}

      <Button variant="outline" size="sm" className={cn('mt-auto w-full justify-center')} onClick={() => onOpen(property)}>
        <ClipboardList className="h-3.5 w-3.5" /> Abrir checklist
      </Button>
    </div>
  );
}