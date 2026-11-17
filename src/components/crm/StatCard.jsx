import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'primary', className }) {
  const tones = {
    primary: 'text-primary bg-primary/10 ring-primary/15',
    emerald: 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-400',
    amber: 'text-amber-600 bg-amber-500/10 ring-amber-500/20 dark:text-amber-400',
    violet: 'text-violet-600 bg-violet-500/10 ring-violet-500/20 dark:text-violet-400',
    rose: 'text-rose-600 bg-rose-500/10 ring-rose-500/20 dark:text-rose-400',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_1px_2px_rgba(26,34,44,.06),0_24px_48px_-34px_rgba(26,34,44,.5)] sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1', tones[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2.5 font-heading text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}