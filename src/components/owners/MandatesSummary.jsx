import React, { useMemo, useState } from 'react';
import { CalendarX, Tag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { propertyTypeLabel } from '@/lib/properties';

const MAX_ROWS = 6;

const monthKey = (property) => String(property.mandate_end || '').slice(0, 7);

const monthLabel = (key) => {
  if (!key) return 'Sin fecha';
  const date = new Date(`${key}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const text = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const DIMENSIONS = [
  {
    id: 'owner',
    title: 'Por propietario',
    icon: User,
    keyOf: (property) => property.owner_name || '',
    labelOf: (property) => property.owner_name || 'Sin propietario',
  },
  {
    id: 'type',
    title: 'Por tipo de inmueble',
    icon: Tag,
    keyOf: (property) => property.property_type || '',
    labelOf: (property) => propertyTypeLabel(property.property_type),
  },
  {
    id: 'month',
    title: 'Por fecha de caducidad',
    icon: CalendarX,
    keyOf: monthKey,
    labelOf: (property) => monthLabel(monthKey(property)),
    chronological: true,
  },
];

export default function MandatesSummary({ rows, title = 'Resumen de mandatos', onSelect, selection }) {
  const [tab, setTab] = useState('todos');

  const expired = useMemo(() => rows.filter(({ status }) => status.state === 'caducado'), [rows]);
  const scoped = tab === 'caducados' ? expired : rows;

  const grouped = useMemo(
    () =>
      DIMENSIONS.map((dimension) => {
        const map = new Map();
        scoped.forEach(({ property }) => {
          const key = dimension.keyOf(property);
          const entry = map.get(key) || { key, label: dimension.labelOf(property), count: 0 };
          entry.count += 1;
          map.set(key, entry);
        });
        const items = [...map.values()].sort(
          dimension.chronological
            ? (a, b) => String(a.key).localeCompare(String(b.key))
            : (a, b) => b.count - a.count || a.label.localeCompare(b.label)
        );
        return { ...dimension, items };
      }),
    [scoped]
  );

  return (
    <section className="card-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-sm font-bold">{title}</h3>
        <span className="text-[11px] text-muted-foreground">
          {scoped.length} {scoped.length === 1 ? 'inmueble' : 'inmuebles'}
        </span>
        <div className="ml-auto flex rounded-full border border-border/70 p-0.5">
          {[
            { id: 'todos', label: `Todos (${rows.length})` },
            { id: 'caducados', label: `Caducados (${expired.length})` },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                tab === option.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {scoped.length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          Sin mandatos que resumir en este filtro.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {grouped.map((dimension) => (
            <div key={dimension.id} className="min-w-0">
              <div className="mb-2 flex items-center gap-1.5">
                <dimension.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{dimension.title}</p>
              </div>
              <ul className="space-y-1.5">
                {dimension.items.slice(0, MAX_ROWS).map((item) => {
                  const active = selection?.dimension === dimension.id && selection?.key === item.key;
                  const Row = onSelect ? 'button' : 'div';
                  return (
                    <li key={`${dimension.id}-${item.key}`}>
                      <Row
                        {...(onSelect
                          ? {
                              type: 'button',
                              onClick: () =>
                                onSelect({
                                  dimension: dimension.id,
                                  key: item.key,
                                  label: item.label,
                                  scope: tab,
                                }),
                            }
                          : {})}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors',
                          active ? 'bg-primary/15 ring-1 ring-primary/40' : 'bg-muted/30',
                          onSelect && !active && 'hover:bg-muted/60',
                          onSelect && 'cursor-pointer'
                        )}
                      >
                        <span className="truncate text-xs text-foreground/90">{item.label}</span>
                        <span className="shrink-0 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-rose-400">
                          {item.count}
                        </span>
                      </Row>
                    </li>
                  );
                })}
                {dimension.items.length > MAX_ROWS && (
                  <li className="px-2.5 pt-0.5 text-[11px] text-muted-foreground">
                    y {dimension.items.length - MAX_ROWS} más
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}