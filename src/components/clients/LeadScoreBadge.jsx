import React from 'react';
import { cn } from '@/lib/utils';
import { scoreBand } from '@/lib/leadScoring';

export default function LeadScoreBadge({ score, showLabel = false, className }) {
  const band = scoreBand(score);
  return (
    <span
      title={`Lead ${band.label.toLowerCase()}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        band.className,
        className
      )}
    >
      {Number(score) || 0}
      {showLabel ? <span className="font-medium">{band.label}</span> : null}
    </span>
  );
}