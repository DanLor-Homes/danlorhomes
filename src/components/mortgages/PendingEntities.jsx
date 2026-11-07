import React from 'react';
import { ExternalLink, Landmark, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingEntities({ offers, onEdit }) {
  if (!offers.length) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-4">
      <p className="text-sm font-semibold">Entidades sin tipo publicado</p>
      <p className="mt-1 text-xs text-muted-foreground">
        No publican TIN ni TAE en su web (obligan a simular). Completa el tipo a mano para que entren en la comparativa.
      </p>
      <ul className="mt-3 divide-y divide-border/60">
        {offers.map((offer) => (
          <li key={offer.id} className="flex items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Landmark className="h-4 w-4 flex-none text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{offer.bank}</p>
                <p className="truncate text-xs text-muted-foreground">{offer.product}</p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-1">
              {offer.link && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={offer.link} target="_blank" rel="noreferrer" title="Ver en la entidad">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => onEdit(offer)}>
                <Pencil className="h-3.5 w-3.5" /> Completar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}