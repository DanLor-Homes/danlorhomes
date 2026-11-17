import React from 'react';

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-2 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="gold-rule" />
            {eyebrow}
          </span>
        )}
        <h1 className="display-title text-[28px] sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>}
    </div>
  );
}