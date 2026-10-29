import React from 'react';
import { STAGE_MAP } from '@/lib/crm';
import { cn } from '@/lib/utils';

export default function StageBadge({ stage, className }) {
  const config = STAGE_MAP[stage];
  const color = config?.color || '#64748b';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className
      )}
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {config?.label || stage || '—'}
    </span>
  );
}