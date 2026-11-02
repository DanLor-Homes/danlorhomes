import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { PORTALS } from '@/lib/portals';
import { cn } from '@/lib/utils';

export default function PortalCoverage({ sources }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold">Cobertura por portal</h2>
        <Link to="/portales" className="text-[11px] font-medium text-primary hover:underline">
          Configurar búsquedas
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {PORTALS.map((portal) => {
          const active = sources.filter((source) => source.portal === portal.id && source.active).length;
          return (
            <div
              key={portal.id}
              className={cn(
                'rounded-xl border p-3',
                active > 0 ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-card/40'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Globe className={cn('h-3.5 w-3.5', active > 0 ? 'text-primary' : 'text-muted-foreground')} />
                <p className="truncate text-xs font-semibold">{portal.label}</p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {active === 0 ? 'Sin búsqueda' : `${active} búsqueda${active === 1 ? '' : 's'}`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}