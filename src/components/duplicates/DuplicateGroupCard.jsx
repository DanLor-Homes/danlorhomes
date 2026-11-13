import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DuplicateGroupCard({ reasons, records, to }) {
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
        {records.map((record) => (
          <Link
            key={record.id}
            to={to}
            className="group flex items-center justify-between gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-accent/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{record.name}</p>
              {record.meta && <p className="truncate text-xs text-muted-foreground">{record.meta}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {record.badge && (
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', record.badge.className)}>
                  {record.badge.label}
                </span>
              )}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}