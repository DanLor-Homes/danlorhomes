import React from 'react';
import { cn } from '@/lib/utils';
import { taskCategory } from '@/lib/taskCategory';

export default function TaskCategoryBadge({ category, className }) {
  const meta = taskCategory(category);
  return (
    <span
      className={cn(
        'rounded border px-1.5 py-0.5 text-[10px] font-medium',
        meta.tone,
        className
      )}
    >
      {meta.label}
    </span>
  );
}