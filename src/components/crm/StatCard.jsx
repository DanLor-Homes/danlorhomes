import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'primary', className }) {
  const tones = {
    primary: 'text-primary bg-primary/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 transition-all duration-300 hover:border-primary/40 sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', tones[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-heading text-[26px] font-extrabold leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}