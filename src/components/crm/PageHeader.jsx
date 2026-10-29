import React from 'react';

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}