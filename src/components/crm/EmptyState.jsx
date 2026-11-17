import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/70">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-heading text-[15px] font-semibold tracking-tight">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}