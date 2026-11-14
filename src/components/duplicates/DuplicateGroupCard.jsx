import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Link2, Merge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import MergeDuplicatesDialog from './MergeDuplicatesDialog';

export default function DuplicateGroupCard({ reasons, records, to, entity, onMerged }) {
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const chosen = records.filter((record) => selected.includes(record.id));

  const handleMerged = () => {
    setSelected([]);
    onMerged?.();
  };

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5 text-primary" />
        {reasons.map((reason) => (
          <span
            key={reason}
            className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
          >
            {reason}
          </span>
        ))}
      </div>

      <div className="divide-y divide-border/60">
        {records.map((record) => {
          const checked = selected.includes(record.id);
          return (
            <div
              key={record.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-1 py-2 transition-colors',
                checked && 'bg-primary/[0.06]'
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                <Checkbox checked={checked} onCheckedChange={() => toggle(record.id)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{record.name}</span>
                  {record.meta && <span className="block truncate text-xs text-muted-foreground">{record.meta}</span>}
                </span>
              </label>
              <div className="flex shrink-0 items-center gap-2">
                {record.badge && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', record.badge.className)}>
                    {record.badge.label}
                  </span>
                )}
                <Link to={to} className="text-muted-foreground transition-colors hover:text-primary">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            {selected.length < 2 ? 'Selecciona al menos dos fichas' : `${selected.length} fichas seleccionadas`}
          </p>
          <Button
            size="sm"
            className="gap-1.5 rounded-full"
            disabled={selected.length < 2}
            onClick={() => setOpen(true)}
          >
            <Merge className="h-3.5 w-3.5" /> Fusionar
          </Button>
        </div>
      )}

      <MergeDuplicatesDialog
        open={open}
        onOpenChange={setOpen}
        entity={entity}
        records={chosen}
        onMerged={handleMerged}
      />
    </div>
  );
}