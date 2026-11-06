import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  urgente: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  alta: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  media: 'border-primary/25 bg-primary/10 text-primary',
  baja: 'border-border bg-muted text-muted-foreground',
};

const LABELS = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export default function PriorityBadge({ level, className }) {
  if (!level || level === 'hecha') return null;
  return (
    <span
      className={cn(
        'rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        TONES[level],
        className
      )}
    >
      {LABELS[level]}
    </span>
  );
}