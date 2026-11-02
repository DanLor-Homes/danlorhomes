import React from 'react';
import { CalendarX, Tag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { propertyTypeLabel } from '@/lib/properties';

const MAX_ROWS = 6;

function group(items, keyFn, sortFn) {
  const map = new Map();
  items.forEach(({ property }) => {
    const { key, label } = keyFn(property);
    const entry = map.get(key) || { key, label, count: 0 };
    entry.count += 1;
    map.set(key, entry);
  });
  return [...map.values()].sort(sortFn || ((a, b) => b.count - a.count));
}

function monthLabel(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const text = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function GroupColumn({ icon: Icon, title, groups }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {groups.slice(0, MAX_ROWS).map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5">
            <span className="truncate text-xs text-foreground/90">{item.label}</span>
            <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', 'bg-rose-500/15 text-rose-400')}>
              {item.count}
            </span>
          </li>
        ))}
        {groups.length > MAX_ROWS && (
          <li className="px-2.5 pt-0.5 text-[11px] text-muted-foreground">
            y {groups.length - MAX_ROWS} más
          </li>
        )}
      </ul>
    </div>
  );
}

export default function ExpiredMandatesSummary({ rows }) {
  if (!rows.length) return null;

  const byOwner = group(rows, (property) => ({
    key: property.owner_name || 'sin-propietario',
    label: property.owner_name || 'Sin propietario',
  }));
  const byType = group(rows, (property) => ({
    key: property.property_type || 'sin-tipo',
    label: propertyTypeLabel(property.property_type),
  }));
  const byDate = group(
    rows,
    (property) => ({ key: property.mandate_end || 'sin-fecha', label: monthLabel(property.mandate_end) }),
    (a, b) => String(a.key).localeCompare(String(b.key))
  );

  return (
    <section className="mt-3 card-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarX className="h-4 w-4 text-rose-400" />
        <h3 className="font-heading text-sm font-bold">Resumen de mandatos caducados</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'inmueble' : 'inmuebles'}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <GroupColumn icon={User} title="Por propietario" groups={byOwner} />
        <GroupColumn icon={Tag} title="Por tipo de inmueble" groups={byType} />
        <GroupColumn icon={CalendarX} title="Por fecha de caducidad" groups={byDate} />
      </div>
    </section>
  );
}